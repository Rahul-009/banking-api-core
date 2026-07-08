import express from "express"
import authController from "../controllers/auth.controller.js"
import {
    registerLimiter,
    loginLimiter,
    refreshTokenLimiter,
    verifyOTPLimiter,
    resendOTPLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter
} from '../middleware/rateLimit.middleware.js';

import { validateRegistration } from '../middleware/validations/auth.validation..js';

const router = express.Router()

router.post("/register", registerLimiter, validateRegistration, authController.userRegisterController)
router.post("/login", loginLimiter, authController.userLoginController)
router.post("/logout", authController.userLogoutController)
router.post('/refresh', refreshTokenLimiter, authController.userRefreshTokenController);

// email verification using OTP
router.post('/verify-otp', verifyOTPLimiter, authController.verifyOTP);
router.post('/resend-otp', resendOTPLimiter, authController.resendOTP);

// password reset routes
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);

export default router