import { body } from 'express-validator';

// Validation rules for a peer account-to-account transfer
export const createTransactionValidation = [
  body('fromAccount')
    .notEmpty()
    .withMessage('fromAccount is required')
    .isMongoId()
    .withMessage('Invalid fromAccount id'),

  body('toAccount')
    .notEmpty()
    .withMessage('toAccount is required')
    .isMongoId()
    .withMessage('Invalid toAccount id'),

  body('amount')
    .notEmpty()
    .withMessage('amount is required')
    .isFloat({ gt: 0 })
    .withMessage('amount must be greater than 0'),

  body('idempotencyKey')
    .notEmpty()
    .withMessage('idempotencyKey is required')
    .isString()
    .withMessage('idempotencyKey must be a string'),

  body('remarks')
    .optional()
    .isString()
    .withMessage('remarks must be a string')
    .isLength({ max: 300 })
    .withMessage('remarks cannot exceed 300 characters')
    .trim(),
];

// Validation rules for system-initiated initial funding
export const createInitialFundsValidation = [
  body('toAccount')
    .notEmpty()
    .withMessage('toAccount is required')
    .isMongoId()
    .withMessage('Invalid toAccount id'),

  body('amount')
    .notEmpty()
    .withMessage('amount is required')
    .isFloat({ gt: 0 })
    .withMessage('amount must be greater than 0'),

  body('idempotencyKey')
    .notEmpty()
    .withMessage('idempotencyKey is required')
    .isString()
    .withMessage('idempotencyKey must be a string'),
];

export default {
  createTransactionValidation,
  createInitialFundsValidation,
};
