import { body } from 'express-validator';

export const validateRegistration = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required'),
];

export const validateForgotPassword = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
];

export const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),

  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

export const validateVerifyOtp = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 8 })
    .withMessage('Invalid OTP format'),
];

export const validateResendOtp = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
];
