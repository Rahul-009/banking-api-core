// controllers/userController.js
import fs from 'fs/promises';
import path from 'path';
import User from '../models/user.model.js';

// Fields a user may edit about their own profile. password/role/email/
// systemUser/etc are deliberately excluded — password changes go through
// changePassword (which routes through the hashing hook), and role/
// systemUser/isActive are never client-settable here.
const ALLOWED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'dateOfBirth',
  'gender',
  'occupation',
  'employer',
  'annualIncome',
];
const ALLOWED_ADDRESS_FIELDS = ['street', 'city', 'state', 'zipCode', 'country'];

// get profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Don't use .lean() - keep as Mongoose document
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // toJSON will auto-apply virtuals and remove sensitive fields
    const profile = user.toJSON();

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// update profile
// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    const user = await User.findById(userId);
    if (!user) {
      if (file) {
        await fs.unlink(file.path).catch(() => {});
      }
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Apply only allowlisted fields — never trust req.body directly.
    for (const field of ALLOWED_PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }
    if (req.body.address && typeof req.body.address === 'object') {
      if (!user.address) user.address = {};
      for (const field of ALLOWED_ADDRESS_FIELDS) {
        if (req.body.address[field] !== undefined) {
          user.address[field] = req.body.address[field];
        }
      }
    }

    if (file) {
      // Delete old profile picture if exists
      if (user.profilePicture) {
        try {
          const oldFilePath = path.join(process.cwd(), user.profilePicture);
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.log('Old profile picture not found:', err.message);
        }
      }
      // profilePicture always comes from the uploaded file, never the body
      user.profilePicture = file.path;
    }

    // save() runs the pre-save hook, which recomputes profileCompletion
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    // If file was uploaded and update failed, delete the uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    console.error('Update profile error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate value: ' + Object.keys(error.keyPattern).join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile',
    });
  }
};

// change password — the only path allowed to write a new password; goes
// through user.save() so the pre-save hashing hook always runs.
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
    });
  }
};

export default {
  getProfile,
  updateProfile,
  changePassword,
};
