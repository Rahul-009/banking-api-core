import express from 'express';

import accountController from '../controllers/account.controller.js';

import authMiddleware from '../middleware/auth.middleware.js';
import { requireCompleteProfile } from '../middleware/profileCompletion.middleware.js';
import validation from '../middleware/validations/account.validation.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';

const router = express.Router();

router.use(authMiddleware.authMiddleware);
router.use(requireCompleteProfile);

// All routes below require a Bearer access token and a 100%-complete
// profile (403 INCOMPLETE_PROFILE otherwise).

/**
 * @swagger
 * /account:
 *   post:
 *     tags: [Account]
 *     summary: Create an account for the authenticated user
 *     description: >
 *       Self-service only — the account always belongs to the caller and always starts
 *       with balance 0 and status PENDING, regardless of what's sent in the body.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountType, accountNumber]
 *             properties:
 *               accountType: { type: string, description: AccountType ObjectId }
 *               accountNumber: { type: string, minLength: 5, maxLength: 20 }
 *               currency: { type: string, enum: [BDT] }
 *               isPrimary: { type: boolean }
 *               remarks: { type: string, maxLength: 300 }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Account' }
 *       400:
 *         description: Validation failed, or already has a primary account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *       409:
 *         description: Account number already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/',
  validation.createAccountValidation,
  validateRequest,
  accountController.createAccount
);

/**
 * @swagger
 * /account:
 *   get:
 *     tags: [Account]
 *     summary: List accounts
 *     description: Regular users only ever see their own accounts. Admins/managers may filter by any user via the `user` query param.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ACTIVE, FROZEN, DORMANT, CLOSED] }
 *       - in: query
 *         name: accountType
 *         schema: { type: string }
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *         description: Admin/manager only — ignored for regular users.
 *       - in: query
 *         name: isPrimary
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, balance, lastTransactionAt, openedAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated list of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Account' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/', validation.listAccountsValidation, validateRequest, accountController.getAccounts);

/**
 * @swagger
 * /account/{id}:
 *   get:
 *     tags: [Account]
 *     summary: Get an account by ID
 *     description: Owner, admin, or manager only.
 *     x-required-role: [owner, admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Account' }
 *       403:
 *         description: Not the owner, admin, or manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/:id',
  validation.accountIdValidation,
  validateRequest,
  accountController.getAccountById
);

/**
 * @swagger
 * /account/number/{accountNumber}:
 *   get:
 *     tags: [Account]
 *     summary: Get an account by account number
 *     description: Owner, admin, or manager only.
 *     x-required-role: [owner, admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema: { type: string, minLength: 5, maxLength: 20 }
 *     responses:
 *       200:
 *         description: Account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Account' }
 *       403:
 *         description: Not the owner, admin, or manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/number/:accountNumber',
  validation.accountNumberValidation,
  validateRequest,
  accountController.getAccountByNumber
);

/**
 * @swagger
 * /account/{id}/balance:
 *   get:
 *     tags: [Account]
 *     summary: Get an account's balance
 *     description: Owner, admin, or manager only.
 *     x-required-role: [owner, admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountNumber: { type: string }
 *                     balance: { type: number }
 *                     currency: { type: string }
 *                     status: { type: string }
 *       403:
 *         description: Not the owner, admin, or manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/:id/balance',
  validation.balanceValidation,
  validateRequest,
  accountController.getAccountBalance
);

/**
 * @swagger
 * /account/{id}:
 *   patch:
 *     tags: [Account]
 *     summary: Update an account
 *     description: >
 *       Owner may update isPrimary/remarks only. accountType/balance/status changes
 *       require an admin or manager — sent by a regular user, those fields are
 *       silently ignored rather than applied.
 *     x-required-role: [owner, admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountType: { type: string, description: Admin/manager only. }
 *               balance: { type: number, minimum: 0, description: Admin/manager only. }
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, FROZEN, DORMANT, CLOSED]
 *                 description: Admin/manager only.
 *               isPrimary: { type: boolean }
 *               remarks: { type: string, maxLength: 300 }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Account' }
 *                 message: { type: string }
 *       403:
 *         description: Not the owner, admin, or manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
  '/:id',
  validation.updateAccountValidation,
  validateRequest,
  accountController.updateAccount
);

/**
 * @swagger
 * /account/{id}/freeze:
 *   patch:
 *     tags: [Account]
 *     summary: Freeze an account
 *     description: Owner, admin, or manager only.
 *     x-required-role: [owner, admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, maxLength: 300 }
 *     responses:
 *       200:
 *         description: Frozen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Account' }
 *                 message: { type: string }
 *       400:
 *         description: Account already closed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not the owner, admin, or manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
  '/:id/freeze',
  validation.freezeAccountValidation,
  validateRequest,
  accountController.freezeAccount
);

/**
 * @swagger
 * /account/{id}/close:
 *   patch:
 *     tags: [Account]
 *     summary: Close an account
 *     description: Admin/manager only. Fails if the account still has a positive balance.
 *     x-required-role: [admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Closed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Account' }
 *                 message: { type: string }
 *       400:
 *         description: Account has a positive balance
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not admin/manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
  '/:id/close',
  authMiddleware.restrictTo('admin', 'manager'),
  validation.accountIdValidation,
  validateRequest,
  accountController.closeAccount
);

/**
 * @swagger
 * /account/{id}/activate:
 *   patch:
 *     tags: [Account]
 *     summary: Reactivate an account
 *     description: Admin/manager only.
 *     x-required-role: [admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Account' }
 *                 message: { type: string }
 *       400:
 *         description: Account already closed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not admin/manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
  '/:id/activate',
  authMiddleware.restrictTo('admin', 'manager'),
  validation.accountIdValidation,
  validateRequest,
  accountController.activateAccount
);

export default router;
