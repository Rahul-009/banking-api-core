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
/**
 * @swagger
 * /account-type:
 *   get:
 *     tags: [AccountType]
 *     summary: List account types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of account types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AccountType' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
/**
 * @swagger
 * /account-type/active:
 *   get:
 *     tags: [AccountType]
 *     summary: List active account types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active account types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AccountType' }
 *                 count: { type: integer }
 */
router.get('/active', authMiddleware.authMiddleware, accountTypeController.getActiveAccountTypes);

/**
 * @route   GET /api/account-type/code/:code
 * @desc    Get account type by code
 * @access  Private
 */
/**
 * @swagger
 * /account-type/code/{code}:
 *   get:
 *     tags: [AccountType]
 *     summary: Get an account type by its code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string, enum: [SAVINGS, CURRENT, STUDENT, WOMEN] }
 *     responses:
 *       200:
 *         description: Account type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AccountType' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
/**
 * @swagger
 * /account-type/{id}:
 *   get:
 *     tags: [AccountType]
 *     summary: Get an account type by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AccountType' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
/**
 * @swagger
 * /account-type/{id}/usage:
 *   get:
 *     tags: [AccountType]
 *     summary: Usage statistics for an account type
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
 *         description: Usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountType:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         code: { type: string }
 *                         name: { type: string }
 *                         isActive: { type: boolean }
 *                     usage:
 *                       type: object
 *                       properties:
 *                         totalAccounts: { type: integer }
 *                         activeAccounts: { type: integer }
 *                         frozenAccounts: { type: integer }
 *                         closedAccounts: { type: integer }
 *                         totalBalance: { type: number }
 *                         usagePercentage: { type: number }
 *       403:
 *         description: Not admin/manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
/**
 * @swagger
 * /account-type/{id}/calculate-interest:
 *   post:
 *     tags: [AccountType]
 *     summary: Calculate interest for a given balance under this account type
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
 *             required: [balance]
 *             properties:
 *               balance: { type: number, minimum: 0, example: 10000 }
 *     responses:
 *       200:
 *         description: Calculated interest
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountType: { $ref: '#/components/schemas/AccountType' }
 *                     balance: { type: number }
 *                     interestRate: { type: number }
 *                     interestAmount: { type: number }
 *                     totalBalance: { type: number }
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
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
/**
 * @swagger
 * /account-type/eligible/{userId}:
 *   get:
 *     tags: [AccountType]
 *     summary: Check which account types a user is eligible for
 *     description: Admin/manager only.
 *     x-required-role: [admin, manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Eligibility breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         age: { type: integer }
 *                         gender: { type: string }
 *                         occupation: { type: string }
 *                     eligible:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/AccountType' }
 *                     ineligible:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/AccountType' }
 *       403:
 *         description: Not admin/manager
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
/**
 * @swagger
 * /account-type:
 *   post:
 *     tags: [AccountType]
 *     summary: Create a new account type
 *     description: Admin only.
 *     x-required-role: [admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string, enum: [SAVINGS, CURRENT, STUDENT, WOMEN] }
 *               name: { type: string, minLength: 3, maxLength: 100 }
 *               description: { type: string, maxLength: 500 }
 *               interestRate: { type: number, minimum: 0, maximum: 100 }
 *               minimumBalance: { type: number, minimum: 0 }
 *               monthlyMaintenanceFee: { type: number, minimum: 0 }
 *               minimumOpeningDeposit: { type: number, minimum: 0 }
 *               dailyWithdrawalLimit: { type: number, minimum: 0 }
 *               maximumDailyTransactions: { type: integer, minimum: 1 }
 *               minimumAge: { type: integer, minimum: 0, maximum: 120 }
 *               maximumAge: { type: integer, minimum: 0, maximum: 120, description: 'Must be >= minimumAge' }
 *               allowedGender: { type: string, enum: [MALE, FEMALE, ANY] }
 *               requiresStudentVerification: { type: boolean }
 *               isActive: { type: boolean }
 *               features: { $ref: '#/components/schemas/AccountTypeFeatures' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/AccountType' }
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *       403:
 *         description: Not admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
/**
 * @swagger
 * /account-type/{id}:
 *   patch:
 *     tags: [AccountType]
 *     summary: Update an account type
 *     description: >
 *       Admin only. Only interestRate, minimumBalance, monthlyMaintenanceFee,
 *       isActive, and features.* may be updated — code/name/description and
 *       the other fields are immutable after creation and are rejected if sent.
 *     x-required-role: [admin]
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
 *               interestRate: { type: number, minimum: 0, maximum: 100 }
 *               minimumBalance: { type: number, minimum: 0 }
 *               monthlyMaintenanceFee: { type: number, minimum: 0 }
 *               isActive: { type: boolean }
 *               features: { $ref: '#/components/schemas/AccountTypeFeatures' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/AccountType' }
 *       400:
 *         description: Validation failed, or an immutable field was included
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *       403:
 *         description: Not admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
/**
 * @swagger
 * /account-type/{id}:
 *   delete:
 *     tags: [AccountType]
 *     summary: Delete an account type
 *     description: Admin only.
 *     x-required-role: [admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { nullable: true, example: null }
 *       403:
 *         description: Not admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
