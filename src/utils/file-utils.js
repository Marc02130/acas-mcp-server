/**
 * File utility functions for MCP server
 */
const path = require('path');
const fs = require('fs').promises;

/**
 * Create a consistent path structure for file storage
 * @param {string} jobId - The unique job ID
 * @param {string} subDir - Optional subdirectory (default: '')
 * @returns {string} - The absolute path to the file storage directory
 */
async function getStoragePath(jobId, subDir = '') {
  // Base uploads directory
  const baseDir = path.join(process.cwd(), 'uploads');
  
  // Job-specific directory with optional subdirectory
  const jobDir = path.join(baseDir, jobId, subDir);
  
  // Ensure the directory exists
  await fs.mkdir(jobDir, { recursive: true });
  
  return jobDir;
}

/**
 * Generate a relative file path that can be used by ACAS
 * @param {string} absolutePath - The absolute path to the file
 * @returns {string} - The relative path for ACAS
 */
function getAcasFilePath(absolutePath) {
  // Convert absolute path to relative path that ACAS can use
  // This assumes the shared volume is mounted at the same location
  const baseDir = path.join(process.cwd(), 'uploads');
  return absolutePath.replace(baseDir, '').replace(/^\//, '');
}

module.exports = {
  getStoragePath,
  getAcasFilePath
}; 