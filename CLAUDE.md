# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the dev server (`node --watch server.js`, auto-restarts on file changes). No `start` script exists.
- `npm test` — runs the Jest + Supertest suite (`tests/`) via `node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand`. Uses `mongodb-memory-server` (`MongoMemoryReplSet`, single node) so it needs no external MongoDB — but the **first run downloads a ~780MB MongoDB binary**, cached at `~/.cache/mongodb-binaries`. Don't run multiple test files concurrently against a cold cache — they'll each try to download the binary at once. If disk space is tight, pre-warm the cache once with a standalone script (`MongoMemoryReplSet.create()` then `.stop()`) before running the full suite.
- `npm run lint` — ESLint (flat config, `eslint.config.js`). `npm run format` — Prettier.
- Requires a `.env` file in the repo root (see `.env.example`): `MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`. Code also reads `FRONTEND_URL` (password reset links, default CORS origin), `CORS_ORIGINS` (optional comma-separated override for multiple allowed origins), and `NODE_ENV` (toggles dev-only response fields and cookie `secure` flags) with sane fallbacks if unset.
- **MongoDB must be a replica set, not standalone** — `connectToDB()` (`src/config/db.js`) calls `process.exit(1)` on connection failure, and the transaction/ledger flow uses `mongoose.startSession()`/multi-document transactions, which MongoDB only supports on a replica set (or mongos). For local dev, initiate a single-node replica set (`mongod --replSet rs0` + `rs.initiate()`); Atlas clusters are replica sets by default.
- ES modules throughout (`"type": "module"` in package.json) — use `import`/`export`, not `require`. Node >= 22 (see `.nvmrc`/`engines`).
- CI: `.github/workflows/ci.yml` runs lint + test on push/PR to `main`.

## Architecture

**Entry point:** `server.js` loads env, connects to MongoDB, then boots the Express app from `src/app.js` on port 3000.

**Request pipeline pattern** (the standard for all routes now, including auth):
```
route → authMiddleware (if protected) → express-validator rules (src/middleware/validations/<resource>.validation.js) → validateRequest.middleware.js → controller
```
`validateRequest` collects `express-validator` errors and returns a uniform `{ success: false, message: 'Validation failed', errors: [...] }` 400 response. Controllers call `next(new AppError(message, statusCode))` on failure rather than writing `res.status()` directly, so errors land in the global error handler in `src/app.js` (last middleware — handles `AppError`, Mongoose `CastError`, and Mongo duplicate-key `11000`, plus a catch-all 500). The global handler also sanitizes `AppError` messages with `statusCode >= 500` outside `NODE_ENV=development`, since those often wrap a raw driver/internal error message — 4xx messages are always shown as-is (they're written to be client-safe).

`auth.controller.js` used to be an exception to this pattern (inline validation, direct `res.status().json()`) — it's been migrated to the standard pattern along with everything else; there is no longer an "older module" style to watch out for.

**Auth** (`src/middleware/auth.middleware.js`, `src/controllers/auth.controller.js`):
- Access token returned in the JSON body (15m expiry, consistent whether issued at login or via refresh); refresh token set as an `httpOnly` cookie (7d expiry), rotated on every `/api/auth/refresh` call. Cookie `secure` flag is `NODE_ENV === 'production'` consistently across login/refresh/logout.
- Both tokens carry a `type: 'access' | 'refresh'` claim, checked by `authMiddleware`/`authSystemUserMiddleware` (must be `access`) and the refresh handler (must be `refresh`) — a leaked refresh token can no longer be used as a bearer access token or vice versa.
- Logout blacklists **both** the refresh token (cookie) and the access token (`Authorization` header, if sent) via `blackList.model.js`'s `tokenBlackListModel.blacklist(token)` static, which sets a per-token `expiresAt` from the token's own `exp` claim (TTL-indexed on `expiresAt`, `expireAfterSeconds: 0`) — this correctly handles both short-lived access tokens and long-lived refresh tokens with one mechanism, rather than a single fixed TTL.
- `authMiddleware` reads the token from `req.cookies.token` OR the `Authorization` header, checks the blacklist, verifies the JWT + token type, and loads the full user onto `req.user`.
- `authSystemUserMiddleware` additionally requires `user.systemUser === true` (used for the internal initial-funds transaction endpoint).
- `restrictTo(...roles)` is a role-gate factory checked against `req.user.role` (`user`/`manager`/`admin`/`superadmin`).
- Account lockout: `userLoginController` calls `user.incrementLoginAttempts()` on a wrong password and `user.resetLoginAttempts()` on success; `User.isAccountLocked` (virtual) locks the account for 30 minutes after 5 failed attempts, checked before the password comparison.

**Account ownership**: every `/api/account` route enforces ownership-or-admin/manager, not just auth. Self-service `POST /`/`PATCH /:id` force `user`/`balance` to the caller and only allow `isPrimary`/`remarks` through the field allowlist for non-privileged callers — `balance`/`status`/`accountType` changes require `admin`/`manager`. `activate`/`close` are admin/manager-only routes; `freeze` and reads are owner-or-admin. Same pattern for `updateProfile` in `profile.controller.js`: an explicit field allowlist (never `req.body` spread), password changes only via the dedicated `PATCH /api/profile/password` (which goes through `user.save()` so the hashing hook always runs — `findByIdAndUpdate` never touches `password`).

**Profile completion gating**: `requireCompleteProfile` (`src/middleware/profileCompletion.middleware.js`) blocks account routes until `user.profileCompletion === 100`. That percentage is auto-recomputed in `user.model.js`'s pre-save hook from a fixed set of optional fields (name, phone, address, DOB, picture, occupation) — updating the profile-completion field list means updating both `calculateProfileCompletion()` and `getMissingFields()` (currently duplicated between `user.model.js` and `profileCompletion.middleware.js`).

**Soft deletes**: `user.model.js` has a `pre(/^find/)` hook that transparently filters every find-style query to `{ isActive: true, deletedAt: null }`. Any query against the User model — including from other files — will silently miss soft-deleted users unless you bypass this deliberately.

**Money/ledger model**: `transaction.controller.js` implements double-entry transfers on `ledgerEntry.model.js` (running balance, `sequenceNo` from an atomic `counter.model.js` document, reversal linking via `reversedBy`, immutability enforced via pre-hooks blocking update/delete/deleteMany at the Mongoose layer — bypass with the raw driver, e.g. `mongoose.connection.collection('ledgerentries')`, if you ever need to clear test data). Both the debit and credit side (account balance update + ledger entry + the `Transaction` doc itself) commit atomically inside a single `mongoose.startSession().withTransaction()` call — **queries against the same session must be sequential, never `Promise.all`'d**, since a Mongo session can only have one operation in flight at a time. `ledger.model.js` no longer exists; there is only the one ledger implementation now.

**Model name / `ref` consistency**: Mongoose model registration names (`mongoose.model("Name", schema)`) are case-sensitive and must match every `ref: "Name"` pointing at them, or `.populate()` fails at runtime with "Schema hasn't been registered for model" — this bit us once already (`user`/`transaction` were registered lowercase while every `ref` used PascalCase). If you add a new model, register it PascalCase to match the existing convention (`User`, `Transaction`, `Account`, `AccountType`, `LedgerEntry`, `Counter`, `OTP`).

**Route mounts** (`src/app.js`) — note these are singular, not the plurals the README used to describe:
- `/api/auth`, `/api/profile`, `/api/account`, `/api/transaction`, `/api/account-type`

Global middleware order in `src/app.js`: `helmet()` → `cors()` (origin from `CORS_ORIGINS` or `FRONTEND_URL`, `credentials: true`) → rate limiter → `express.json()` → `cookieParser()`.

**Other models present but not yet wired to routes/controllers**: `depositProduct`, `dps`, `dpsInstallment`, `fixedDeposit` — schema exists, no corresponding controller/route yet. Note `depositProduct.model.js`/`dps.model.js`/`dpsInstallment.model.js` still use CommonJS `require`/`module.exports` despite the project being `"type": "module"` — they'd throw on import; harmless only because nothing imports them yet.

**File uploads**: profile pictures go through `multer` (`src/middleware/upload.middleware.js`) to `uploads/profiles/`, 1MB size limit, JPEG/JPG/PNG only (error messages now match the actual limit/allowed types).

**Tests** (`tests/`): `tests/helpers/db.js` spins up/tears down a `MongoMemoryReplSet`; `tests/helpers/factories.js` has `createCompleteUser()` (fills every field `calculateProfileCompletion()` checks, so `requireCompleteProfile` doesn't block test requests) and `createAccountFor()`/`accessTokenFor()`. Tests hit `app` directly via Supertest — they bypass `/api/auth/register` (which sends a real email via Resend) and create users directly through the model instead.
