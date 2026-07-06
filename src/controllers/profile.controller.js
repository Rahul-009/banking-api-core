// controllers/userController.js
import User from '../models/user.model.js';

// get profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        
        // Don't use .lean() - keep as Mongoose document
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // toJSON will auto-apply virtuals and remove sensitive fields
        const profile = user.toJSON();

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// update profile
// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = { ...req.body };
        const file = req.file;

    
        if (file) {
            // Delete old profile picture if exists
            console.log("file is here")
            const oldUser = await User.findById(userId);
            
            if (oldUser.profilePicture) {
                try {
                    const oldFilePath = path.join(process.cwd(), oldUser.profilePicture);
                    await fs.unlink(oldFilePath);
                } catch (err) {
                    console.log('Old profile picture not found:', err.message);
                }
            }
            // add profile picture to update data
            updateData.profilePicture = file.path;
        }

        // Update user - find and update with validation
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            {
                new: true,           // Return updated document
                runValidators: true,  // Run schema validators
                context: 'query'      // Required for custom validators
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate profile completion after update
        updatedUser.profileCompletion = updatedUser.calculateProfileCompletion();
        await updatedUser.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
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
                message: 'Duplicate value: ' + Object.keys(error.keyPattern).join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating profile',
        });
    }
};

export default {
    getProfile, 
    updateProfile,
};