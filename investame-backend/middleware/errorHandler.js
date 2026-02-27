const logger = require('../utils/logger');

// ─── Error transformation helpers ─────────────────────────────────────────────

const handleCastErrorDB = (err) => {
  return { message: `Invalid ${err.path}: "${err.value}"`, statusCode: 400 };
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return {
    message: `Duplicate value "${value}" for field "${field}". Please use a different value.`,
    statusCode: 409,
  };
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return {
    message: `Validation failed: ${errors.join('. ')}`,
    statusCode: 422,
  };
};

const handleJWTError = () => ({
  message: 'Invalid token. Please log in again.',
  statusCode: 401,
});

const handleJWTExpiredError = () => ({
  message: 'Your session has expired. Please log in again.',
  statusCode: 401,
});

// ─── Dev vs Prod response formats ─────────────────────────────────────────────

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Trusted, user-facing error
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or unknown error — don't leak details
  logger.error('UNHANDLED ERROR:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
  });
};

// ─── Main error handler ────────────────────────────────────────────────────────

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  // Production: transform known Mongoose/JWT errors into friendly messages
  let transformed = { message: err.message, statusCode: err.statusCode, isOperational: err.isOperational };

  if (err.name === 'CastError') Object.assign(transformed, handleCastErrorDB(err), { isOperational: true });
  if (err.code === 11000) Object.assign(transformed, handleDuplicateFieldsDB(err), { isOperational: true });
  if (err.name === 'ValidationError') Object.assign(transformed, handleValidationErrorDB(err), { isOperational: true });
  if (err.name === 'JsonWebTokenError') Object.assign(transformed, handleJWTError(), { isOperational: true });
  if (err.name === 'TokenExpiredError') Object.assign(transformed, handleJWTExpiredError(), { isOperational: true });

  // Reconstruct an error-like object for the prod sender
  const finalErr = {
    statusCode: transformed.statusCode,
    status: `${transformed.statusCode}`.startsWith('4') ? 'fail' : 'error',
    message: transformed.message,
    isOperational: transformed.isOperational ?? false,
  };

  sendErrorProd(finalErr, res);
};

module.exports = globalErrorHandler;
