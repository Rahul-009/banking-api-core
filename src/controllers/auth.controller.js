import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import userModel from '../models/user.model.js';
import otpModel from '../models/otp.model.js';
import tokenBlackListModel from '../models/blackList.model.js';

import { sendEmail } from '../services/email.service.js';
import { generateOtp, getOtpHtml } from '../utils/otp.utils.js';
import { generateResetToken, getResetPasswordHtml } from '../utils/reset.utils.js';
import AppError from '../utils/appError.utils.js';

// -------------------- REGISTER --------------------
async function userRegisterController(req, res, next) {
  try {
    const { email, password, name } = req.body;

    // Check existing user
    const isExists = await userModel.findOne({ email });
    if (isExists) {
      return next(new AppError('User already exists with this email', 409));
    }

    // Create user (password hashed in pre-save hook)
    const user = await userModel.create({
      email,
      password,
      name,
    });

    // Generate OTP
    const otp = generateOtp();
    const html = getOtpHtml(otp);

    // Hash OTP for storage
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store OTP in database
    await otpModel.create({
      email,
      userId: user._id,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    });

    // Send OTP via email
    try {
      const subject = 'Email Verification - OTP Code';
      await sendEmail(email, subject, html);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return next(new AppError('Failed to send verification email. Please try again.', 500));
    }

    // Success response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user._id,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}

// -------------------- LOGIN --------------------
async function userLoginController(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.isAccountLocked) {
      return next(
        new AppError(
          'Account is temporarily locked due to too many failed login attempts. Please try again later.',
          403
        )
      );
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      return next(new AppError('Invalid email or password', 401));
    }

    await user.resetLoginAttempts();

    // Generate tokens
    const refreshToken = jwt.sign({ userId: user._id, type: 'refresh' }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const accessToken = jwt.sign({ userId: user._id, type: 'access' }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}

// -------------------- LOGOUT --------------------
async function userLogoutController(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Blacklist both tokens so a stolen access token can't keep being
    // used after logout, not just the refresh token.
    if (refreshToken) {
      await tokenBlackListModel.blacklist(refreshToken);
    }
    if (accessToken) {
      await tokenBlackListModel.blacklist(accessToken);
    }

    // Clear cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Success response
    return res.status(200).json({
      success: true,
      message: 'User logged out successfully',
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}

// -------------------- REFRESH TOKEN --------------------
async function userRefreshTokenController(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AppError('Refresh token not found', 401));
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlackListModel.findOne({ token: refreshToken });
    if (isBlacklisted) {
      return next(new AppError('Invalid refresh token', 403));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return next(new AppError('Invalid or expired refresh token', 403));
    }

    if (decoded.type !== 'refresh') {
      return next(new AppError('Invalid token type', 403));
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate new refresh token (rotation)
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Blacklist old refresh token
    await tokenBlackListModel.blacklist(refreshToken);

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}

async function verifyOTP(req, res, next) {
  try {
    const { email, otp } = req.body;

    // Hash the provided OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find OTP record
    const otpRecord = await otpModel.findOne({ email, otpHash });

    if (!otpRecord) {
      return next(new AppError('Invalid OTP', 400));
    }

    // Check if OTP expired
    if (otpRecord.expiresAt < new Date()) {
      await otpModel.findByIdAndDelete(otpRecord._id);
      return next(new AppError('OTP has expired. Please request a new one.', 400));
    }

    // Find user and update verification status
    const user = await userModel.findById(otpRecord.userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user is already verified
    if (user.emailVerified) {
      await otpModel.findByIdAndDelete(otpRecord._id);
      return next(new AppError('User is already verified', 400));
    }

    // Update user verification status
    user.emailVerified = true;
    await user.save();

    // Delete used OTP
    await otpModel.findByIdAndDelete(otpRecord._id);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}

// Resend OTP
async function resendOTP(req, res, next) {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.emailVerified) {
      return next(new AppError('User is already verified', 400));
    }

    // Delete existing OTPs for this user
    await otpModel.deleteMany({ email });

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store new OTP
    await otpModel.create({
      email,
      userId: user._id,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send OTP via email
    const subject = 'Email Verification - OTP Code';
    const html = getOtpHtml(otp);
    await sendEmail(email, subject, html);

    return res.status(200).json({
      success: true,
      message: 'New OTP sent successfully to your email',
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}

// Request password reset
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });

    // For security, don't reveal if email exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    }

    // Check if user is verified
    if (!user.emailVerified) {
      return next(new AppError('Please verify your email first before resetting password', 400));
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token to database
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Create reset link (adjust URL based on your frontend)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;

    // Send email
    const html = getResetPasswordHtml(user.name, resetLink);
    const subject = 'Password Reset Request';
    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Clear token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return next(new AppError('Failed to send reset email. Please try again later.', 500));
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
      // In development, return the token/link for testing
      ...(process.env.NODE_ENV === 'development' && { data: { resetToken, resetLink } }),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}

// Reset password with token
export const resetPassword = async (req, res, next) => {
  try {
    const { token, email, newPassword } = req.body;

    // Hash the token from request
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await userModel.findOne({
      email,
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token. Please request a new one.', 400));
    }

    // Update user password and clear reset fields
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export default {
  userRegisterController,
  userLoginController,
  userLogoutController,
  userRefreshTokenController,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
};
