/**
 * Main middleware to check profile completion
 */
export const requireCompleteProfile = async (req, res, next) => {
  try {
    const user = req.user;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please login first.'
      });
    }

    // Check if user is active (not soft-deleted)
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is locked. Please try again later.'
      });
    }

    // Check profile completion
    const profileCompletion = user.profileCompletion || 0;
    
    if (profileCompletion < 100) {
      // Get missing fields for better user experience
      const missingFields = getMissingFields(user);
      
      return res.status(403).json({
        success: false,
        message: 'Please complete your profile before accessing this resource',
        error: 'INCOMPLETE_PROFILE',
        data: {
          profileCompletion: profileCompletion,
          requiredCompletion: 100,
          missingFields: missingFields,
          action: 'Complete your profile at: PATCH /api/users/profile'
        }
      });
    }

    next();

  } catch (error) {
    next(error);
  }
};


const getMissingFields = (user) => {
  const missingFields = [];
  
  // Required fields for complete profile
  const fields = [
    { name: 'firstName', value: user.firstName },
    { name: 'lastName', value: user.lastName },
    { name: 'phone', value: user.phone },
    { name: 'address.street', value: user.address?.street },
    { name: 'address.city', value: user.address?.city },
    { name: 'address.zipCode', value: user.address?.zipCode },
    { name: 'dateOfBirth', value: user.dateOfBirth },
    { name: 'profilePicture', value: user.profilePicture },
    { name: 'occupation', value: user.occupation },
  ];
  
  fields.forEach(field => {
    // Check if field is empty, null, or undefined
    if (!field.value || field.value === '') {
      missingFields.push(field.name);
    }
  });
  
  return missingFields;
};