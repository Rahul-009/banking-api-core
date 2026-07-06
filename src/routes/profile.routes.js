import express from "express";
import profileController from "../controllers/profile.controller.js"

import authMiddleware from "../middleware/auth.middleware.js";
import { 
    uploadProfilePicture, 
    handleMulterError 
} from '../middleware/upload.middleware.js';

import { 
    validateProfileUpdate, 
    handleValidationErrors,
    sanitizeUpdateData 
} from '../middleware/validation.middleware.js';

const router = new express.Router()

router.get('/get-profile', authMiddleware.authMiddleware, profileController.getProfile);
router.put('/update-profile',
    authMiddleware.authMiddleware,
    uploadProfilePicture,                    // Handle file upload first
    handleMulterError,                       // Handle multer errors
    sanitizeUpdateData,                      // Clean empty fields
    validateProfileUpdate,                   // Validate all fields
    handleValidationErrors,                 // Return validation errors
    profileController.updateProfile                           // Update the profile
);

export default router