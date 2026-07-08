import express from 'express';
import authController from '../controllers/auth.controller.js';
import {
  registerLimiter,
  loginLimiter,
  refreshTokenLimiter,
  verifyOTPLimiter,
  resendOTPLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimit.middleware.js';

import {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyOtp,
  validateResendOtp,
} from '../middleware/validations/auth.validation.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Sends a verification OTP by email. The account is not verified until POST /auth/verify-otp succeeds.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain an uppercase letter, a lowercase letter, and a digit.
 *               name: { type: string, minLength: 2, maxLength: 50 }
 *     responses:
 *       201:
 *         description: Registered — OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: string }
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/register',
  registerLimiter,
  validateRegistration,
  validateRequest,
  authController.userRegisterController
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in
 *     description: >
 *       On success, sets a 7-day httpOnly refreshToken cookie and returns a 15-minute
 *       accessToken in the response body. 5 failed attempts locks the account for 30 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         email: { type: string }
 *                         name: { type: string }
 *                     accessToken: { type: string }
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Account temporarily locked after too many failed attempts
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/login',
  loginLimiter,
  validateLogin,
  validateRequest,
  authController.userLoginController
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out
 *     description: >
 *       Blacklists the Bearer access token (if sent) and the refreshToken cookie (if present) —
 *       both are optional; whichever is provided gets invalidated. Clears the refreshToken cookie.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 */
router.post('/logout', authController.userLogoutController);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token and get a new access token
 *     description: Reads the refreshToken cookie, blacklists it, and issues a new access + refresh token pair.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *       401:
 *         description: Refresh token missing
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Refresh token invalid, expired, blacklisted, or not a refresh-type token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/refresh', refreshTokenLimiter, authController.userRefreshTokenController);

// email verification using OTP

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with the OTP sent at registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string, minLength: 4, maxLength: 8 }
 *     responses:
 *       200:
 *         description: Email verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         email: { type: string }
 *                         emailVerified: { type: boolean }
 *       400:
 *         description: Invalid or expired OTP, or already verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/verify-otp',
  verifyOTPLimiter,
  validateVerifyOtp,
  validateRequest,
  authController.verifyOTP
);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: New OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400:
 *         description: Already verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/resend-otp',
  resendOTPLimiter,
  validateResendOtp,
  validateRequest,
  authController.resendOTP
);

// password reset routes

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     description: >
 *       Always returns 200 regardless of whether the email is registered, to avoid
 *       leaking account existence. In NODE_ENV=development, the response also includes
 *       the raw reset token/link for testing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent (or silently a no-op if the email isn't registered)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400:
 *         description: Email not verified yet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateForgotPassword,
  validateRequest,
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using the token from the reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, email, newPassword, confirmPassword]
 *             properties:
 *               token: { type: string }
 *               email: { type: string, format: email }
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain an uppercase letter, a lowercase letter, and a digit.
 *               confirmPassword: { type: string, description: Must match newPassword. }
 *     responses:
 *       200:
 *         description: Password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400:
 *         description: Invalid/expired reset token, or validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 */
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateResetPassword,
  validateRequest,
  authController.resetPassword
);

export default router;
