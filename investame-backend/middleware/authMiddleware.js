const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Verifies the JWT from the Authorization header and attaches
 * the full user document to req.user.
 */
const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in.', 401));
  }

  // 3. Confirm user still exists and is active
  const user = await User.findById(decoded.id).select('+isActive');
  if (!user) {
    return next(new AppError('The user associated with this token no longer exists.', 401));
  }
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  req.user = user;
  next();
});

/**
 * Role-based access control factory.
 * Usage: restrictTo('innovator', 'investor')
 *
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Access denied. This route is restricted to: ${roles.join(', ')}.`,
        403
      )
    );
  }
  next();
};

module.exports = { protect, restrictTo };
