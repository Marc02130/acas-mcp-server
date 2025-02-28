/**
 * Central error handling middleware
 * Provides consistent error responses across the application
 */
const config = require('../config');

// Define custom error types
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Indicates this is a known operational error
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error for request validation failures
class ValidationError extends AppError {
  constructor(details) {
    super('Validation error', 400, details);
  }
}

// Not found error
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal server error';
  let errorDetails = err.details || null;
  let stack = err.stack;
  
  // Log error details
  console.error(`[ERROR] ${errorMessage}`, {
    statusCode,
    details: errorDetails,
    path: req.path,
    method: req.method,
    stack: stack
  });
  
  // Handle specific error types
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    statusCode = 400;
    errorMessage = 'Invalid JSON in request body';
  }
  
  // Prepare error response
  const errorResponse = {
    error: true,
    message: errorMessage
  };
  
  // Add details if they exist
  if (errorDetails) {
    errorResponse.details = errorDetails;
  }
  
  // Include stack trace in development mode
  if (config.nodeEnv === 'development' && stack) {
    errorResponse.stack = stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Export both the error handler middleware and the custom error classes
module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  NotFoundError
}; 