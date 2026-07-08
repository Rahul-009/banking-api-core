import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { validationResult } from 'express-validator';

import userModel from "../models/user.model.js";
import otpModel from "../models/otp.model.js";
import tokenBlackListModel from "../models/blackList.model.js";

import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/otp.utils.js";
import { generateResetToken, getResetPasswordHtml } from "../utils/reset.utils.js";

// -------------------- REGISTER --------------------
async function userRegisterController(req, res) {
    try {
        // Input validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const { email, password, name } = req.body;

        // Check existing user
        const isExists = await userModel.findOne({ email });
        if (isExists) {
            return res.status(409).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        // Create user (password hashed in pre-save hook)
        const user = await userModel.create({
            email, password, name
        });

        // Generate OTP
        const otp = generateOtp();
        const html = getOtpHtml(otp);

        // Hash OTP for storage
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        // Store OTP in database
        await otpModel.create({
            email,
            userId: user._id,
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        });

        // Send OTP via email
        try {
            const subject = "Email Verification - OTP Code";
            
            await sendEmail(
                email,
                subject,
                html
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            return res.status(500).json({
                message: "Failed to send verification email. Please try again."
            });
        }

        // Success response
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                userId: user._id,
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

// -------------------- LOGIN --------------------
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user with password
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate tokens
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Set refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Success response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    name: user.name
                },
                accessToken 
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

// -------------------- LOGOUT --------------------
async function userLogoutController(req, res) {
    try {

        const token = req.cookies.refreshToken

        // Blacklist refresh token 
        if (token) {
            await tokenBlackListModel.create({
                token: token
            });
        }

        // Clear cookies
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict"
        });

        // Success response
        return res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during logout"
        });
    }
}

// -------------------- REFRESH TOKEN --------------------
async function userRefreshTokenController(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token not found"
            });
        }

        // Check if token is blacklisted
        const isBlacklisted = await tokenBlackListModel.findOne({ token: refreshToken });
        if (isBlacklisted) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // Generate new refresh token (rotation)
        const newRefreshToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Blacklist old refresh token
        await tokenBlackListModel.create({
            token: refreshToken
        });

        // Set new refresh token cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken: newAccessToken
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}


async function verifyOTP(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Please provide email and OTP"
            });
        }

        // Hash the provided OTP
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        // Find OTP record
        const otpRecord = await otpModel.findOne({
            email,
            otpHash
        });

        if (!otpRecord) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // Check if OTP expired
        if (otpRecord.expiresAt < new Date()) {
            // Delete expired OTP
            await otpModel.findByIdAndDelete(otpRecord._id);
            return res.status(400).json({
                message: "OTP has expired. Please request a new one."
            });
        }

        // Find user and update verification status
        const user = await userModel.findById(otpRecord.userId);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check if user is already verified
        if (user.emailVerified) {
            await otpModel.findByIdAndDelete(otpRecord._id);
            return res.status(400).json({
                message: "User is already verified"
            });
        }

        // Update user verification status
        user.emailVerified = true;
        await user.save();

        // Delete used OTP
        await otpModel.findByIdAndDelete(otpRecord._id);

        res.status(200).json({
            message: "Email verified successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                emailVerified: user.emailVerified
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            message: "Internal server error. Please try again later."
        });
    }
}

// Resend OTP
async function resendOTP(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Please provide email"
            });
        }

        // Check if user exists
        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                message: "User is already emailVerified"
            });
        }

        // Delete existing OTPs for this user
        await otpModel.deleteMany({ email });

        // Generate new OTP
        const otp = generateOtp();
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        // Store new OTP
        await otpModel.create({
            email,
            userId: user._id,
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        // Send OTP via email
        const subject = "Email Verification - OTP Code";
        const html = getOtpHtml(otp);
        await sendEmail(
            email,
            subject,
            html
        );

        res.status(200).json({
            message: "New OTP sent successfully to your email"
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            message: "Internal server error. Please try again later."
        });
    }
}

// Request password reset
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        // Find user by email
        const user = await userModel.findOne({ email });

        // For security, don't reveal if email exists or not
        if (!user) {
            return res.status(200).json({
                message: "If your email is registered, you will receive a password reset link"
            });
        }

        // Check if user is verified
        if (!user.emailVerified) {
            return res.status(400).json({
                message: "Please verify your email first before resetting password"
            });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Save token to database
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // Create reset link (adjust URL based on your frontend)
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;

        // Send email
        const html = getResetPasswordHtml(user.name, resetLink);
        const subject = "Password Reset Request";
        try {
            await sendEmail(user.email, subject, html);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Clear token if email fails
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
            return res.status(500).json({
                message: "Failed to send reset email. Please try again later."
            });
        }

        res.status(200).json({
            message: "Password reset link sent to your email",
            // In development, you might want to return the token for testing
            ...(process.env.NODE_ENV === 'development' && { resetToken, resetLink })
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            message: "Internal server error. Please try again later."
        });
    }
};

// Reset password with token
export const resetPassword = async (req, res) => {
    try {
        const { token, email, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!token || !email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Please provide token, email, new password and confirm password"
            });
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        // Hash the token from request
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find user with valid token
        const user = await userModel.findOne({
            email,
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: Date.now() } // Token not expired
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token. Please request a new one."
            });
        }

        // Update user password and clear reset fields
        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        // Optional: Send confirmation email
        // await sendPasswordChangedEmail(user.email, user.username);

        res.status(200).json({
            message: "Password reset successful. You can now login with your new password."
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            message: "Internal server error. Please try again later."
        });
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
    resetPassword
};