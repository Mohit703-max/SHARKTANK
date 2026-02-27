const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    }),
  role: Joi.string()
    .valid('innovator', 'investor', 'user')
    .required()
    .messages({ 'any.only': 'Role must be innovator, investor, or user.' }),
});

const login = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
  password: Joi.string().required(),
});

module.exports = { register, login };
