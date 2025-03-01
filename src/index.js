// Load environment variables first
require('dotenv').config();

// MCP Server main entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const processRoutes = require('./routes/process');

// Initialize Express app
const app = express();
const PORT = config.port || 3002;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: true,
  credentials: true  // Important for authentication with cookies
})); 
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with increased limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies
app.use(morgan('combined')); // HTTP request logging

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Server',
    version: '1.0.0',
    description: 'Microchemistry Processing Server for ACAS'
  });
});

// Basic route for server health check (legacy path, keep for compatibility)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API v1 routes
const apiV1Router = express.Router();

// Health check (v1)
apiV1Router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: 'v1'
  });
});

// Auth routes
apiV1Router.use('/auth', authRoutes);

// Process routes
apiV1Router.use('/process', processRoutes);

// Mount the v1 router
app.use('/api/v1', apiV1Router);

// Handle 404 errors for unmatched routes
app.use(notFoundHandler);

// Global error handler - must be the last middleware
app.use(errorHandler);

// Only start the server if this file is run directly (not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
  });
}

// Export the app for testing
module.exports = app; 