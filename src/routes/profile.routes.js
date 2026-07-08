import express from 'express';
import profileController from '../controllers/profile.controller.js';

import authMiddleware from '../middleware/auth.middleware.js';
import { uploadProfilePicture, handleMulterError } from '../middleware/upload.middleware.js';

import {
  validateProfileUpdate,
  sanitizeUpdateData,
  validateChangePassword,
} from '../middleware/validations/profile.validation.js';

import { validateRequest } from '../middleware/validateRequest.middleware.js';

const router = new express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', authMiddleware.authMiddleware, profileController.getProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     tags: [Profile]
 *     summary: Update the authenticated user's profile
 *     description: >
 *       Only an allowlist of fields is ever applied (never the raw request body) —
 *       password and role can never be changed through this endpoint. To change the
 *       password, use PATCH /profile/password instead.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: JPEG/JPG/PNG, max 1MB.
 *               firstName: { type: string, minLength: 1, maxLength: 50 }
 *               lastName: { type: string, minLength: 1, maxLength: 50 }
 *               phone: { type: string, description: '10-15 digits, optional leading +' }
 *               dateOfBirth: { type: string, format: date, description: 'Age must be 18-120.' }
 *               gender:
 *                 type: string
 *                 enum: [male, female, non-binary, prefer-not-to-say, other]
 *               occupation: { type: string, maxLength: 100 }
 *               employer: { type: string, maxLength: 100 }
 *               annualIncome: { type: integer, minimum: 0, maximum: 1000000000 }
 *               address.street: { type: string, maxLength: 200 }
 *               address.city: { type: string, minLength: 1, maxLength: 100 }
 *               address.state: { type: string, minLength: 1, maxLength: 100 }
 *               address.country: { type: string, minLength: 1, maxLength: 100 }
 *               address.zipCode: { type: string, description: '4 digits' }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation failed, or bad file upload
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 */
router.put(
  '/',
  authMiddleware.authMiddleware,
  uploadProfilePicture, // Handle file upload first
  handleMulterError, // Handle multer errors
  sanitizeUpdateData, // Clean empty fields
  validateProfileUpdate, // Validate all fields
  validateRequest, // Return validation errors
  profileController.updateProfile // Update the profile
);

/**
 * @swagger
 * /profile/password:
 *   patch:
 *     tags: [Profile]
 *     summary: Change the authenticated user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       401:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
  '/password',
  authMiddleware.authMiddleware,
  validateChangePassword,
  validateRequest,
  profileController.changePassword
);

export default router;
