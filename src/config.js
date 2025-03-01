/**
 * Configuration management module
 */
require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 3002,
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // ROO server configuration
  rooBaseUrl: process.env.ROO_BASE_URL || 'http://roo:8080/acas/api/v1',
  
  // ACAS configuration
  acasBaseUrl: process.env.ACAS_BASE_URL || 'http://acas:3000',
  
  // OpenAI configuration
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  
  // Authentication tokens (for development)
  apiTokens: {
    'cron-job-token': {
      name: 'File Processing Cron Job',
      roles: ['ROLE_FILE_PROCESSOR']
    }
  },
  
  // File upload configuration
  uploads: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    maxFiles: parseInt(process.env.MAX_FILES) || 5
  }
};

module.exports = config; 