// MCP Server main entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

// Initialize Express app
const app = express();
const PORT = config.port || 3002;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors());   // Enable CORS for all requests
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with increased limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies
app.use(morgan('combined')); // HTTP request logging

// Basic route for server health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Server',
    version: '1.0.0',
    description: 'Microchemistry Processing Server for ACAS'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});

// For testing purposes
module.exports = app; 