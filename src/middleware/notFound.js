/**
 * Middleware to handle routes that don't match any handler
 * This ensures a consistent 404 response format
 */
const { NotFoundError } = require('./errorHandler');

/**
 * Not found handler middleware 
 * Generates a 404 error for any request that reaches this middleware
 * This should be placed after all route handlers and before the error handler
 */
const notFoundHandler = (req, res, next) => {
  // Create a not found error with the requested path
  const error = new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`);
  
  // Pass the error to the next middleware (which should be the error handler)
  next(error);
};

module.exports = notFoundHandler; 