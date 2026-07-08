import { body, param, query } from 'express-validator'

/**
 * Validation rules for creating an account type
 */
const validateCreateAccountType = [
  // Code validation
  body('code')
    .notEmpty()
    .withMessage('Account type code is required')
    .isIn(['SAVINGS', 'CURRENT', 'STUDENT', 'WOMEN'])
    .withMessage('Code must be one of: SAVINGS, CURRENT, STUDENT, WOMEN')
    .trim()
    .toUpperCase(),

  // Name validation
  body('name')
    .notEmpty()
    .withMessage('Account type name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .trim(),

  // Description validation
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

  // Interest rate validation
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Interest rate must be between 0 and 100'),

  // Minimum balance validation
  body('minimumBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum balance must be a positive number'),

  // Monthly maintenance fee validation
  body('monthlyMaintenanceFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly maintenance fee must be a positive number'),

  // Minimum opening deposit validation
  body('minimumOpeningDeposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum opening deposit must be a positive number'),

  // Daily withdrawal limit validation
  body('dailyWithdrawalLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily withdrawal limit must be a positive number'),

  // Maximum daily transactions validation
  body('maximumDailyTransactions')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum daily transactions must be at least 1'),

  // Minimum age validation
  body('minimumAge')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Minimum age must be between 0 and 120'),

  // Maximum age validation
  body('maximumAge')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Maximum age must be between 0 and 120')
    .custom((value, { req }) => {
      if (req.body.minimumAge && value < req.body.minimumAge) {
        throw new Error('Maximum age must be greater than minimum age');
      }
      return true;
    }),

  // Allowed gender validation
  body('allowedGender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'ANY'])
    .withMessage('Gender must be MALE, FEMALE, or ANY'),

  // Student verification validation
  body('requiresStudentVerification')
    .optional()
    .isBoolean()
    .withMessage('requiresStudentVerification must be a boolean'),

  // Active status validation
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  // Features validation
  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object'),

  body('features.atmCard')
    .optional()
    .isBoolean()
    .withMessage('atmCard must be a boolean'),

  body('features.chequeBook')
    .optional()
    .isBoolean()
    .withMessage('chequeBook must be a boolean'),

  body('features.internetBanking')
    .optional()
    .isBoolean()
    .withMessage('internetBanking must be a boolean'),

  body('features.mobileBanking')
    .optional()
    .isBoolean()
    .withMessage('mobileBanking must be a boolean'),

  body('features.smsAlert')
    .optional()
    .isBoolean()
    .withMessage('smsAlert must be a boolean'),
];

/**
 * Validation rules for updating an account type
 */
const validateUpdateAccountType = [
  // ID validation
  param('id')
    .isMongoId()
    .withMessage('Invalid account type ID format'),

  // Only allow specific fields to be updated
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Interest rate must be between 0 and 100'),

  body('minimumBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum balance must be a positive number'),

  body('monthlyMaintenanceFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly maintenance fee must be a positive number'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  // Features validation
  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object'),

  body('features.atmCard')
    .optional()
    .isBoolean()
    .withMessage('atmCard must be a boolean'),

  body('features.chequeBook')
    .optional()
    .isBoolean()
    .withMessage('chequeBook must be a boolean'),

  body('features.internetBanking')
    .optional()
    .isBoolean()
    .withMessage('internetBanking must be a boolean'),

  body('features.mobileBanking')
    .optional()
    .isBoolean()
    .withMessage('mobileBanking must be a boolean'),

  body('features.smsAlert')
    .optional()
    .isBoolean()
    .withMessage('smsAlert must be a boolean'),

  // ⚠️ Block disallowed fields
  body('code')
    .not()
    .exists()
    .withMessage('Code cannot be updated'),

  body('name')
    .not()
    .exists()
    .withMessage('Name cannot be updated'),

  body('description')
    .not()
    .exists()
    .withMessage('Description cannot be updated'),

  body('minimumOpeningDeposit')
    .not()
    .exists()
    .withMessage('Minimum opening deposit cannot be updated'),

  body('dailyWithdrawalLimit')
    .not()
    .exists()
    .withMessage('Daily withdrawal limit cannot be updated'),

  body('maximumDailyTransactions')
    .not()
    .exists()
    .withMessage('Maximum daily transactions cannot be updated'),

  body('minimumAge')
    .not()
    .exists()
    .withMessage('Minimum age cannot be updated'),

  body('maximumAge')
    .not()
    .exists()
    .withMessage('Maximum age cannot be updated'),

  body('allowedGender')
    .not()
    .exists()
    .withMessage('Allowed gender cannot be updated'),

  body('requiresStudentVerification')
    .not()
    .exists()
    .withMessage('Student verification requirement cannot be updated'),
];

/**
 * Validation rules for getting account type by ID
 */
const validateGetAccountType = [
  param('id')
    .isMongoId()
    .withMessage('Invalid account type ID format'),
];
/**
 * Validation rules for getting account type by code
 */
const validateGetAccountTypeByCode = [
  param('code')
    .notEmpty()
    .withMessage('Account type code is required')
    .isIn(['SAVINGS', 'CURRENT', 'STUDENT', 'WOMEN'])
    .withMessage('Code must be one of: SAVINGS, CURRENT, STUDENT, WOMEN')
    .trim()
    .toUpperCase(),
];

/**
 * Validation rules for deleting account type
 */
const validateDeleteAccountType = [
  param('id')
    .isMongoId()
    .withMessage('Invalid account type ID format'),
];

/**
 * Validation rules for calculating interest
 */
const validateCalculateInterest = [
  param('id')
    .isMongoId()
    .withMessage('Invalid account type ID format'),
  
  body('balance')
    .notEmpty()
    .withMessage('Balance is required')
    .isFloat({ min: 0 })
    .withMessage('Balance must be a positive number'),
];

/**
 * Validation rules for checking eligibility
 */
const validateCheckEligibility = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
];

/**
 * Validation rules for getting account types with pagination
 */
const validateGetAccountTypes = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
];

export default {
  validateCreateAccountType,
  validateUpdateAccountType,
  validateGetAccountType,
  validateGetAccountTypeByCode,
  validateDeleteAccountType,
  validateCalculateInterest,
  validateCheckEligibility,
  validateGetAccountTypes,
}