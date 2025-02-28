/**
 * Authentication middleware for MCP Server
 * Supports both API token auth (for scripts) and session auth (for browser users)
 */
const axios = require('axios');
const config = require('../config');

// Simple token verification for server-to-server authentication
// In production, use a more secure token generation and validation mechanism
const API_TOKENS = {
  'cron-job-token': {
    name: 'File Processing Cron Job',
    roles: ['ROLE_FILE_PROCESSOR']
  }
};

/**
 * Authentication middleware that validates requests
 * @param {Object} options - Configuration options
 * @param {Array} options.requiredRoles - Roles that are allowed to access the endpoint (optional)
 */
const authenticate = (options = {}) => {
  const { requiredRoles = [] } = options;
  
  return async (req, res, next) => {
    try {
      // Check for API token (server-to-server)
      const apiToken = req.headers['x-api-token'];
      
      if (apiToken && API_TOKENS[apiToken]) {
        // API token authentication
        const tokenData = API_TOKENS[apiToken];
        
        // Check if roles are required
        if (requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role => 
            tokenData.roles.includes(role)
          );
          
          if (!hasRequiredRole) {
            return res.status(403).json({
              error: true,
              message: 'Insufficient permissions for this token'
            });
          }
        }
        
        // Add user info to request
        req.user = {
          name: tokenData.name,
          roles: tokenData.roles,
          authenticatedVia: 'api-token'
        };
        
        return next();
      }
      
      // If no API token, check for session cookie (browser users)
      const cookies = req.headers.cookie;
      
      if (!cookies) {
        return res.status(401).json({
          error: true,
          message: 'Authentication required'
        });
      }
      
      // Call ROO server to validate session
      const response = await axios.get(`${config.rooBaseUrl}/authors/getuser`, {
        headers: {
          Cookie: cookies
        }
      });
      
      // If we get here, the session is valid
      const user = response.data;
      user.authenticatedVia = 'session';
      
      // Check if roles are required
      if (requiredRoles.length > 0) {
        const userRoles = user.roles || [];
        const hasRequiredRole = requiredRoles.some(role => 
          userRoles.includes(role)
        );
        
        if (!hasRequiredRole) {
          return res.status(403).json({
            error: true,
            message: 'Insufficient permissions'
          });
        }
      }
      
      // Add user to request object
      req.user = user;
      
      next();
    } catch (error) {
      // Check if it's an authentication error from ROO
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return res.status(401).json({
          error: true,
          message: 'Invalid or expired session'
        });
      }
      
      // Server error
      console.error('Authentication error:', error);
      return res.status(500).json({
        error: true,
        message: 'Authentication service unavailable'
      });
    }
  };
};

module.exports = authenticate; 