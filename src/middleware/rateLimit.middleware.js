// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// ============ GLOBAL RATE LIMITER ============
// Applied to all routes by default
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests too
});

// ============ AUTH ROUTE LIMITERS ============

// Register - Strict limit to prevent brute force user creation
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registration attempts per hour
  message: {
    message: 'Too many registration attempts from this IP, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login - Strict limit to prevent brute force attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false, // Count failed attempts too
});

// Refresh Token - Moderate limit
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 refresh token requests per 15 minutes
  message: {
    message: 'Too many token refresh requests, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ OTP ROUTE LIMITERS ============

// Verify OTP - Strict limit to prevent brute force attacks
export const verifyOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 verification attempts per 15 minutes
  message: {
    message: 'Too many OTP verification attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false, // Count failed attempts too
});

// Resend OTP - Strict limit to prevent spam
export const resendOTPLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 resend requests per hour
  message: {
    message: 'Too many OTP resend requests, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ PASSWORD RESET ROUTE LIMITERS ============

// Forgot Password - Strict limit to prevent spam
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 forgot password requests per hour
  message: {
    message: 'Too many password reset requests, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Reset Password - Strict limit to prevent brute force attacks
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 reset attempts per 15 minutes
  message: {
    message: 'Too many password reset attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
});

// ============ MORE RESTRICTIVE LIMITERS (Optional) ============

// Public API - Very strict
export const publicAPILimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    message: 'Too many requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin routes - More permissive
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    message: 'Too many admin requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
