// MCP Server configuration
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Define config object with defaults and environment variable overrides
const config = {
  // Server configuration
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // ACAS integration
  acasBaseUrl: process.env.ACAS_BASE_URL || 'http://acas:3000',
  rooBaseUrl: process.env.ROO_BASE_URL || 'http://roo:8080/acas/api/v1',
  
  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Security settings
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
};

// Validate required configuration
function validateConfig() {
  const requiredVars = [
    'acasBaseUrl',
    'rooBaseUrl'
  ];
  
  const missingVars = requiredVars.filter(varName => !config[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing required configuration: ${missingVars.join(', ')}`);
  }
}

// Run validation
validateConfig();

module.exports = config; 