import { body, param, query } from 'express-validator';

// Validation rules for creating an account
export const createAccountValidation = [
  body('user')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('accountType')
    .notEmpty()
    .withMessage('Account type is required')
    .isMongoId()
    .withMessage('Invalid account type ID format'),

  body('accountNumber')
    .notEmpty()
    .withMessage('Account number is required')
    .isString()
    .withMessage('Account number must be a string')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Account number must be between 5 and 20 characters'),

  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string')
    .isIn(['BDT'])
    .withMessage('Currency must be BDT'),

  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),

  body('remarks')
    .optional()
    .isString()
    .withMessage('Remarks must be a string')
    .isLength({ max: 300 })
    .withMessage('Remarks cannot exceed 300 characters')
    .trim(),
];

// Validation rules for updating an account
export const updateAccountValidation = [
  param('id').isMongoId().withMessage('Invalid account ID format'),

  body('accountType').optional().isMongoId().withMessage('Invalid account type ID format'),

  body('balance')
    .optional()
    .isNumeric()
    .withMessage('Balance must be a number')
    .isFloat({ min: 0 })
    .withMessage('Balance cannot be negative'),

  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['PENDING', 'ACTIVE', 'FROZEN', 'DORMANT', 'CLOSED'])
    .withMessage('Invalid status value'),

  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),

  body('remarks')
    .optional()
    .isString()
    .withMessage('Remarks must be a string')
    .isLength({ max: 300 })
    .withMessage('Remarks cannot exceed 300 characters')
    .trim(),
];

// Validation rules for account ID parameter
export const accountIdValidation = [
  param('id').isMongoId().withMessage('Invalid account ID format'),
];

// Validation rules for account number parameter
export const accountNumberValidation = [
  param('accountNumber')
    .notEmpty()
    .withMessage('Account number is required')
    .isString()
    .withMessage('Account number must be a string')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Account number must be between 5 and 20 characters'),
];

// Validation rules for balance query
export const balanceValidation = [param('id').isMongoId().withMessage('Invalid account ID format')];

// Validation rules for ledger and transactions with pagination
export const ledgerTransactionsValidation = [
  param('id').isMongoId().withMessage('Invalid account ID format'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 (YYYY-MM-DD)')
    .toDate(),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 (YYYY-MM-DD)')
    .toDate(),

  query('type')
    .optional()
    .isString()
    .withMessage('Type must be a string')
    .isIn(['CREDIT', 'DEBIT', 'ALL'])
    .withMessage('Type must be CREDIT, DEBIT, or ALL'),
];

// Validation rules for account listing with filters
export const listAccountsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['PENDING', 'ACTIVE', 'FROZEN', 'DORMANT', 'CLOSED'])
    .withMessage('Invalid status value'),

  query('accountType').optional().isMongoId().withMessage('Invalid account type ID format'),

  query('user').optional().isMongoId().withMessage('Invalid user ID format'),

  query('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean').toBoolean(),

  query('sortBy')
    .optional()
    .isString()
    .withMessage('sortBy must be a string')
    .isIn(['createdAt', 'balance', 'lastTransactionAt', 'openedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isString()
    .withMessage('sortOrder must be a string')
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
];

// Validation rules for deposit/withdraw operations
export const transactionValidation = [
  param('id').isMongoId().withMessage('Invalid account ID format'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

  body('reference').optional().isString().withMessage('Reference must be a string').trim(),
];

// Validation rules for freezing an account
export const freezeAccountValidation = [
  param('id').isMongoId().withMessage('Invalid account ID format'),

  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 300 })
    .withMessage('Reason cannot exceed 300 characters')
    .trim(),
];

// Export all validations as a single object for easier imports
export default {
  createAccountValidation,
  updateAccountValidation,
  accountIdValidation,
  accountNumberValidation,
  balanceValidation,
  ledgerTransactionsValidation,
  listAccountsValidation,
  transactionValidation,
  freezeAccountValidation,
};
