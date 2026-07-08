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

router.get('/', authMiddleware.authMiddleware, profileController.getProfile);
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
router.patch(
  '/password',
  authMiddleware.authMiddleware,
  validateChangePassword,
  validateRequest,
  profileController.changePassword
);

export default router;
