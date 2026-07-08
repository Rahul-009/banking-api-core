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

router.post(
  '/register',
  registerLimiter,
  validateRegistration,
  validateRequest,
  authController.userRegisterController
);
router.post(
  '/login',
  loginLimiter,
  validateLogin,
  validateRequest,
  authController.userLoginController
);
router.post('/logout', authController.userLogoutController);
router.post('/refresh', refreshTokenLimiter, authController.userRefreshTokenController);

// email verification using OTP
router.post(
  '/verify-otp',
  verifyOTPLimiter,
  validateVerifyOtp,
  validateRequest,
  authController.verifyOTP
);
router.post(
  '/resend-otp',
  resendOTPLimiter,
  validateResendOtp,
  validateRequest,
  authController.resendOTP
);

// password reset routes
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateForgotPassword,
  validateRequest,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateResetPassword,
  validateRequest,
  authController.resetPassword
);

export default router;
