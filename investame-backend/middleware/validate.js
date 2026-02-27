const AppError = require('../utils/AppError');

/**
 * Validates req.body against a Joi schema.
 * Returns a clean 422 with all validation messages if invalid.
 *
 * @param {import('joi').Schema} schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {//collect all the errors and clean values
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // Collect ALL errors, not just the first
    stripUnknown: true,  // Remove fields not in schema — prevents mass assignment
    convert: true,       // Type coercion (e.g., "123" → 123)
  });
//shows what the error is.
  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, '')).join('. ');
    return next(new AppError(`Validation error: ${messages}`, 422));
  }

  req.body = value; // Replace body with sanitized/coerced value
  next();
};

module.exports = validate;
