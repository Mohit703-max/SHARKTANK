const Joi = require('joi');

const VALID_INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education',
  'E-Commerce', 'Real Estate', 'Energy', 'Agriculture',
  'Media', 'Logistics', 'Other',
];

const createPitch = Joi.object({
  title: Joi.string().trim().min(5).max(120).required(),
  description: Joi.string().trim().min(30).max(5000).required(),
  industry: Joi.string()
    .valid(...VALID_INDUSTRIES)
    .required()
    .messages({ 'any.only': `Industry must be one of: ${VALID_INDUSTRIES.join(', ')}` }),
  fundingGoal: Joi.number().positive().min(1000).required().messages({
    'number.min': 'Funding goal must be at least $1,000.',
  }),
  equityOffered: Joi.number().min(0.1).max(100).optional(),
});

const updatePitch = Joi.object({
  title: Joi.string().trim().min(5).max(120),
  description: Joi.string().trim().min(30).max(5000),
  industry: Joi.string().valid(...VALID_INDUSTRIES),
  fundingGoal: Joi.number().positive().min(1000),
  equityOffered: Joi.number().min(0.1).max(100),
  fundingStatus: Joi.string().valid('open', 'funded', 'closed'),
}).min(1); // Require at least one field

const swipe = Joi.object({
  liked: Joi.boolean().required().messages({
    'any.required': 'liked (true/false) is required.',
  }),
});

const feedQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  industry: Joi.string().valid(...VALID_INDUSTRIES).optional(),
  sort: Joi.string().valid('newest', 'oldest', 'fundingGoal_asc', 'fundingGoal_desc').default('newest'),
});

module.exports = { createPitch, updatePitch, swipe, feedQuery };
