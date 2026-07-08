# Banking-api-core

## Project Description

The Banking API Core is a backend application designed to manage banking operations such as user authentication, account management, and transaction processing. It is built using Node.js and Express.js, with MongoDB as the database. The API provides secure endpoints for user registration, login, account creation, and transaction handling.

## API Endpoints
### Authentication Endpoints:
- POST /register: Register a new user.
- POST /login: Log in an existing user.
- POST /logout: Log out the current user.
- POST /refresh: get new access token with refresh token rotation.
- POST /verify-otp: For email verification.
- POST /resend-otp: Resends OTP on user request.
- POST /forgot-password: Sends reset password email.
- POST /reset-password: Resets user password.

### Profile Endpoints (`/api/profile`):
- GET /: Fetch the authenticated user's profile.
- PUT /: Update the authenticated user's profile (only a fixed allowlist of fields — password/role/etc. are never accepted here).
- PATCH /password: Change the authenticated user's password (requires current password).

### Account Endpoints (`/api/account`):
- POST /: Create a new account for the authenticated user (requires a complete profile).
- GET /: List the authenticated user's accounts (admins/managers may filter by `user`).
- GET /:id: Get a specific account (owner or admin/manager only).
- GET /number/:accountNumber: Get an account by its account number (owner or admin/manager only).
- GET /:id/balance: Get an account's balance (owner or admin/manager only).
- PATCH /:id: Update an account (owner may update `isPrimary`/`remarks`; `balance`/`status`/`accountType` require admin/manager).
- PATCH /:id/freeze: Freeze an account (owner or admin/manager).
- PATCH /:id/close: Close an account (admin/manager only).
- PATCH /:id/activate: Reactivate an account (admin/manager only).

### Account Type Endpoints (`/api/account-type`):
- GET /: List account types.
- GET /active: List active account types.
- GET /code/:code: Get an account type by code.
- GET /:id: Get an account type by ID.
- GET /:id/usage: Usage statistics for an account type (admin/manager only).
- POST /:id/calculate-interest: Calculate interest for a given balance.
- GET /eligible/:userId: Check which account types a user is eligible for (admin/manager only).
- POST /: Create an account type (admin only).
- PATCH /:id: Update an account type (admin only).
- DELETE /:id: Delete an account type (admin only).

### Transaction Endpoints (`/api/transaction`):
- POST /: Create a peer-to-peer account transfer (requires authentication; double-entry, idempotent via `idempotencyKey`).
- POST /system/initial-funds: Seed an account with initial funds (requires system-user authentication).

# Getting Started

## Prerequisites
### Ensure you have the following installed on your system:

- Node.js (v22 or higher — see `.nvmrc`)
- npm (Node Package Manager)
- MongoDB ( remotely or with replicaset locally)

### Starting the project
- clone the repo
```bash
git clone https://github.com/yourusername/banking-api.git
```
- Navigate to the project directory
```bash
cd banking-api
```
- Install dependencies
```bash
npm install
```

- Create a .env file in root directory (follow the `.env.example` file)


- Start the development server
```bash
npm run dev
```