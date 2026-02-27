/**
 * Wraps an async route handler and forwards any thrown errors to Express's
 * next(err) — eliminating repetitive try/catch blocks in controllers.
 *
 * @param {Function} fn - Async express handler (req, res, next)
 * @returns {Function} - Express middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
