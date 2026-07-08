import { validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 * This will run after all validation rules and return errors if any
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors for better readability
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      // Include for debugging
      invalidFields: formattedErrors.map(e => e.field),
    });
  }

  next();
};