/**
 * Data processing routes
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const openaiService = require('../services/openai-service');
const { getAcasFilePath } = require('../utils/file-utils');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in a uploads directory with a subdirectory for each job
    const jobId = uuidv4();
    req.jobId = jobId;
    
    const uploadDir = path.join(__dirname, '../../uploads', jobId);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename but make it safe
    const fileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, fileName);
  }
});

// File filter to validate acceptable file types
const fileFilter = (req, file, cb) => {
  // Accept csv, excel, and common raw data formats
  const allowedTypes = [
    // CSV and Excel formats
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text formats
    'text/plain',
    'text/tab-separated-values',
    // Binary formats (common raw data)
    'application/octet-stream'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Accepted types: ${allowedTypes.join(', ')}`), false);
  }
};

// Set up multer middleware
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Store jobs in memory (use a database in production)
const jobs = {};

/**
 * Upload file(s) for processing
 * POST /api/v1/process/upload
 */
router.post('/upload', authenticate(), upload.array('files', 5), async (req, res) => {
  try {
    // Get uploaded files
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No files uploaded'
      });
    }
    
    // Get metadata from request body
    const { experimentId, protocolId, description } = req.body;
    
    // Create job information
    const jobId = req.jobId; // Set by multer
    jobs[jobId] = {
      id: jobId,
      status: 'pending',
      files: files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype
      })),
      metadata: {
        experimentId,
        protocolId,
        description
      },
      createdAt: new Date().toISOString(),
      createdBy: req.user.name || req.user.username || 'system'
    };
    
    // Process the job asynchronously
    // This will be replaced with Bull queue
    processJob(jobId);
    
    // Return job ID and status
    res.status(202).json({
      jobId,
      status: 'pending',
      message: 'Files uploaded and processing started',
      files: files.map(file => file.originalname)
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    res.status(500).json({
      error: true,
      message: 'Error processing file upload',
      details: error.message
    });
  }
});

// Get job status
router.get('/jobs/:jobId', authenticate(), async (req, res) => {
  const { jobId } = req.params;
  
  if (!jobs[jobId]) {
    return res.status(404).json({
      error: true,
      message: `Job ${jobId} not found`
    });
  }
  
  res.json(jobs[jobId]);
});

// Process job asynchronously
async function processJob(jobId) {
  try {
    // Update job status
    jobs[jobId].status = 'processing';
    
    // Use OpenAI service to generate ISA-Tab
    const result = await openaiService.generateISATab(jobs[jobId]);
    
    if (result.success) {
      // Update job with success
      jobs[jobId].status = 'completed';
      jobs[jobId].completedAt = new Date().toISOString();
      jobs[jobId].result = {
        message: 'Processing completed successfully',
        isaTabFiles: result.files.map(file => ({
          filename: file.filename,
          path: getAcasFilePath(file.path) // Convert to ACAS-friendly path
        })),
        // Store raw response for debugging
        rawResponse: result.rawResponse
      };
    } else {
      throw new Error(result.error || 'Unknown error during ISA-Tab generation');
    }
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    
    // Update job with error
    jobs[jobId].status = 'failed';
    jobs[jobId].error = error.message;
    jobs[jobId].completedAt = new Date().toISOString();
  }
}

module.exports = router; 