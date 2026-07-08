import { body, validationResult} from 'express-validator'

// Validation rules for profile update
export const validateProfileUpdate = [
    // Name validations
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name can only contain letters, spaces, apostrophes, and hyphens')
        .escape(),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name can only contain letters, spaces, apostrophes, and hyphens')
        .escape(),

    // Phone validation
    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[\d\s-]{10,15}$/)
        .withMessage('Please enter a valid phone number (10-15 digits, optional +)')
        .escape(),

    // Address validations
    body('address.street')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Street address cannot exceed 200 characters')
        .escape(),

    body('address.city')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('City must be between 1 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('City can only contain letters, spaces, apostrophes, and hyphens')
        .escape(),

    body('address.state')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('State must be between 1 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('State can only contain letters, spaces, apostrophes, and hyphens')
        .escape(),

    body('address.zipCode')
        .optional()
        .trim()
        .matches(/^\d{4}$/)
        .withMessage('Please enter a valid ZIP code (e.g.')
        .escape(),

    body('address.country')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Country must be between 1 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Country can only contain letters, spaces, apostrophes, and hyphens')
        .escape(),

    // Demographic validations
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
        .custom((value) => {
            const date = new Date(value);
            const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            if (age < 18) {
                throw new Error('You must be at least 18 years old');
            }
            if (age > 120) {
                throw new Error('Invalid age');
            }
            return true;
        }),

    body('gender')
        .optional()
        .isIn(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'])
        .withMessage('Invalid gender option'),

    // Professional validations
    body('occupation')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Occupation cannot exceed 100 characters')
        .escape(),

    body('employer')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Employer cannot exceed 100 characters')
        .escape(),

    body('annualIncome')
        .optional()
        .isInt({ min: 0, max: 1000000000 })
        .withMessage('Annual income must be a positive number less than 1 billion')
        .toInt(),

    // Preferences validations
    body('preferences.language')
        .optional()
        .isIn(['en', 'es', 'fr', 'de', 'zh', 'ja'])
        .withMessage('Invalid language selection'),

    body('preferences.timezone')
        .optional()
        .isString()
        .withMessage('Invalid timezone'),

    body('preferences.currency')
        .optional()
        .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
        .withMessage('Invalid currency'),

    body('preferences.theme')
        .optional()
        .isIn(['light', 'dark', 'system'])
        .withMessage('Invalid theme selection'),

    body('preferences.notifications.email')
        .optional()
        .isBoolean()
        .withMessage('Email notification preference must be boolean')
        .toBoolean(),

    body('preferences.notifications.sms')
        .optional()
        .isBoolean()
        .withMessage('SMS notification preference must be boolean')
        .toBoolean(),

    body('preferences.notifications.push')
        .optional()
        .isBoolean()
        .withMessage('Push notification preference must be boolean')
        .toBoolean(),

    // File validation will be handled by multer
];

// Sanitize update data (remove undefined fields)
export const sanitizeUpdateData = (req, res, next) => {
    if (req.body) {
        // Remove empty strings
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === '') {
                delete req.body[key];
            }
        });

        // Handle nested address object
        if (req.body.address) {
            Object.keys(req.body.address).forEach(key => {
                if (req.body.address[key] === '') {
                    delete req.body.address[key];
                }
            });
            // Remove address if empty
            if (Object.keys(req.body.address).length === 0) {
                delete req.body.address;
            }
        }
    }
    next();
};