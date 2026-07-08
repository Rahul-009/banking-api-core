import express from 'express';

// Controllers
import accountTypeController from '../controllers/accountType.controller.js';

// middlewares
import authMiddleware from '../middleware/auth.middleware.js';
import validation from '../middleware/validations/accountType.validation.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { requireCompleteProfile } from '../middleware/profileCompletion.middleware.js';

const router = express.Router();

router.use(authMiddleware.authMiddleware);
router.use(requireCompleteProfile);

// ============================================================
//  PUBLIC ROUTES (require authentication)
// ============================================================

/**
 * @route   GET /api/account-type
 * @desc    Get all account types with pagination and filters
 * @access  Private
 */
router.get(
  '/',
  validation.validateGetAccountTypes,
  validateRequest,
  accountTypeController.getAllAccountTypes
);

/**
 * @route   GET /api/account-type/active
 * @desc    Get all active account types
 * @access  Private
 */
router.get('/active', authMiddleware.authMiddleware, accountTypeController.getActiveAccountTypes);

/**
 * @route   GET /api/account-type/code/:code
 * @desc    Get account type by code
 * @access  Private
 */
router.get(
  '/code/:code',
  authMiddleware.authMiddleware,
  validation.validateGetAccountTypeByCode,
  validateRequest,
  accountTypeController.getAccountTypeByCode
);

/**
 * @route   GET /api/account-type/:id
 * @desc    Get account type by ID
 * @access  Private
 */
router.get(
  '/:id',
  authMiddleware.authMiddleware,
  validation.validateGetAccountType,
  validateRequest,
  accountTypeController.getAccountTypeById
);

/**
 * @route   GET /api/account-type/:id/usage
 * @desc    Get usage statistics for an account type
 * @access  Private (Admin/Manager only)
 */
router.get(
  '/:id/usage',
  authMiddleware.authMiddleware,
  authMiddleware.restrictTo('admin', 'manager'),
  validation.validateGetAccountType,
  validateRequest,
  accountTypeController.getAccountTypeUsage
);

/**
 * @route   POST /api/account-type/:id/calculate-interest
 * @desc    Calculate interest for a given balance
 * @access  Private
 */
router.post(
  '/:id/calculate-interest',
  authMiddleware.authMiddleware,
  validation.validateCalculateInterest,
  validateRequest,
  accountTypeController.calculateInterest
);

/**
 * @route   GET /api/account-type/eligible/:userId
 * @desc    Check which account types a user is eligible for
 * @access  Private (Admin/Manager only)
 */
router.get(
  '/eligible/:userId',
  authMiddleware.authMiddleware,
  authMiddleware.restrictTo('admin', 'manager'),
  validation.validateCheckEligibility,
  validateRequest,
  accountTypeController.checkEligibility
);

// ============================================================
//  ADMIN ONLY ROUTES
// ============================================================

/**
 * @route   POST /api/account-type
 * @desc    Create a new account type
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authMiddleware.authMiddleware,
  authMiddleware.restrictTo('admin'),
  validation.validateCreateAccountType,
  validateRequest,
  accountTypeController.createAccountType
);

/**
 * @route   PATCH /api/account-types/:id
 * @desc    Update an account type
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authMiddleware.authMiddleware,
  authMiddleware.restrictTo('admin'),
  validation.validateUpdateAccountType,
  validateRequest,
  accountTypeController.updateAccountType
);

/**
 * @route   DELETE /api/account-types/:id
 * @desc    Delete an account type
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authMiddleware.authMiddleware,
  authMiddleware.restrictTo('admin'),
  validation.validateDeleteAccountType,
  validateRequest,
  accountTypeController.deleteAccountType
);

export default router;
