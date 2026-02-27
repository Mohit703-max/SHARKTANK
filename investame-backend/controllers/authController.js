const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/auth/register
 */
const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);

  sendSuccess(res, 201, 'Account created successfully.', {
    token,
    user: user.toPublicJSON(),
  });
});

/**
 * POST /api/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);

  sendSuccess(res, 200, 'Login successful.', {
    token,
    user: user.toPublicJSON(),
  });
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
const getMe = catchAsync(async (req, res) => {
  sendSuccess(res, 200, 'Profile fetched.', {
    user: req.user.toPublicJSON(),
  });
});

module.exports = { register, login, getMe };
