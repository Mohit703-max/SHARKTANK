const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Generates a signed JWT for a user.
 * @param {string} userId
 * @returns {string} Signed JWT
 */
//token generated is stored in signtoken
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Registers a new user.
 * @param {{ name, email, password, role }} dto
 * @returns {{ user: User, token: string }}
 */
const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({ name, email, password, role });
  const token = signToken(user._id);//generates token.

  return { user, token };
};

/**
 * Authenticates an existing user.
 * @param {{ email, password }} dto
 * @returns {{ user: User, token: string }}
 */
const loginUser = async ({ email, password }) => {
  // Must explicitly select password as it's excluded by default
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Update last login timestamp (non-blocking)
  User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).exec();

  const token = signToken(user._id);
  return { user, token };
};

module.exports = { registerUser, loginUser };
