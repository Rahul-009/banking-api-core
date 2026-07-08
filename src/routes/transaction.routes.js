import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import transactionController from '../controllers/transaction.controller.js';
import validation from '../middleware/validations/transaction.validation.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';

const transactionRoutes = Router();

/**
 * @swagger
 * /transaction:
 *   post:
 *     tags: [Transaction]
 *     summary: Transfer funds between two accounts
 *     description: >
 *       Double-entry transfer, atomic across both accounts' balances and both ledger
 *       entries. The caller must own fromAccount (unless admin/manager). Idempotent —
 *       replaying the same idempotencyKey returns the original result instead of
 *       transferring again: 200 if it already COMPLETED, 202 if still PENDING/PROCESSING.
 *       A key previously used for a FAILED/REVERSED transaction is rejected (409) —
 *       use a new key.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromAccount, toAccount, amount, idempotencyKey]
 *             properties:
 *               fromAccount: { type: string, description: Account ObjectId. Must be owned by the caller unless admin/manager. }
 *               toAccount: { type: string, description: Account ObjectId. }
 *               amount: { type: number, exclusiveMinimum: 0 }
 *               idempotencyKey: { type: string, description: Unique client-generated key for safe retries. }
 *               remarks: { type: string, maxLength: 300 }
 *     responses:
 *       201:
 *         description: Transaction completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Transaction' }
 *       200:
 *         description: Idempotent replay — transaction was already COMPLETED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Transaction already processed }
 *                 data: { $ref: '#/components/schemas/Transaction' }
 *       202:
 *         description: Idempotent replay — transaction is still PENDING/PROCESSING
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Transaction is still processing }
 *                 data: { $ref: '#/components/schemas/Transaction' }
 *       400:
 *         description: Validation failed, insufficient balance, same fromAccount/toAccount, or an account isn't ACTIVE
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *       403:
 *         description: Caller does not own fromAccount
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: idempotencyKey previously used for a failed/reversed transaction
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
transactionRoutes.post(
  '/',
  authMiddleware.authMiddleware,
  validation.createTransactionValidation,
  validateRequest,
  transactionController.createTransaction
);

/**
 * @swagger
 * /transaction/system/initial-funds:
 *   post:
 *     tags: [Transaction]
 *     summary: Seed an account with initial funds
 *     description: >
 *       System-user only — debits the calling system user's own account and credits
 *       toAccount. Same atomicity/idempotency behavior as POST /transaction.
 *     x-required-role: [systemUser]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toAccount, amount, idempotencyKey]
 *             properties:
 *               toAccount: { type: string, description: Account ObjectId. }
 *               amount: { type: number, exclusiveMinimum: 0 }
 *               idempotencyKey: { type: string }
 *     responses:
 *       201:
 *         description: Initial funds transaction completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Transaction' }
 *       200:
 *         description: Idempotent replay — already COMPLETED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Transaction' }
 *       202:
 *         description: Idempotent replay — still PENDING/PROCESSING
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Transaction' }
 *       400:
 *         description: Validation failed, insufficient balance, or system account not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *       403:
 *         description: Caller is not a system user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
transactionRoutes.post(
  '/system/initial-funds',
  authMiddleware.authSystemUserMiddleware,
  validation.createInitialFundsValidation,
  validateRequest,
  transactionController.createInitialFundsTransaction
);

export default transactionRoutes;
