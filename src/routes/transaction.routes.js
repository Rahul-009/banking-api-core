import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import transactionController from '../controllers/transaction.controller.js';
import validation from '../middleware/validations/transaction.validation.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';

const transactionRoutes = Router();

transactionRoutes.post(
  '/',
  authMiddleware.authMiddleware,
  validation.createTransactionValidation,
  validateRequest,
  transactionController.createTransaction
);
transactionRoutes.post(
  '/system/initial-funds',
  authMiddleware.authSystemUserMiddleware,
  validation.createInitialFundsValidation,
  validateRequest,
  transactionController.createInitialFundsTransaction
);

export default transactionRoutes;
