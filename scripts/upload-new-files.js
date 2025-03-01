#!/usr/bin/env node
/**
 * File monitoring script to be run by cron job
 * Detects new files in a directory and uploads them to MCP server
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const glob = require('glob');

// Configuration
const WATCH_DIR = process.env.WATCH_DIR || '/path/to/raw/data/directory';
const MCP_URL = process.env.MCP_URL || 'http://localhost:3002/api/v1';
const API_TOKEN = process.env.API_TOKEN || 'cron-job-token';
const PROCESSED_MARKER = '.processed';

// Find all files in the watch directory that haven't been processed yet
async function findNewFiles() {
  return new Promise((resolve, reject) => {
    glob(`${WATCH_DIR}/**/*`, { nodir: true }, (err, files) => {
      if (err) return reject(err);
      
      // Filter out already processed files
      const newFiles = files.filter(file => {
        const markerFile = `${file}${PROCESSED_MARKER}`;
        return !fs.existsSync(markerFile);
      });
      
      resolve(newFiles);
    });
  });
}

// Process a single file
async function processFile(filePath) {
  try {
    console.log(`Processing file: ${filePath}`);
    
    // Read file
    const fileContent = fs.readFileSync(filePath);
    const fileBuffer = Buffer.from(fileContent);
    const fileBase64 = fileBuffer.toString('base64');
    
    // Get experiment info from path or filename
    const fileName = path.basename(filePath);
    
    // Create payload
    const payload = {
      fileName: fileName,
      fileContent: fileBase64,
      experimentId: extractExperimentId(fileName) || 'unknown',
      protocolId: extractProtocolId(fileName) || 'unknown'
    };
    
    // Send to MCP server
    const response = await axios.post(`${MCP_URL}/process/raw-data`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': API_TOKEN
      }
    });
    
    console.log(`File processed successfully: ${fileName}`);
    console.log(`Job ID: ${response.data.jobId}`);
    
    // Mark as processed
    fs.writeFileSync(`${filePath}${PROCESSED_MARKER}`, new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    return false;
  }
}

// Extract experiment ID from filename (customize based on your naming convention)
function extractExperimentId(fileName) {
  // Example: extract EXPT-12345 from filename like DATA_EXPT-12345_20220131.csv
  const match = fileName.match(/EXPT-\d+/);
  return match ? match[0] : null;
}

// Extract protocol ID from filename (customize based on your naming convention)
function extractProtocolId(fileName) {
  // Example: extract PROT-789 from filename like DATA_EXPT-12345_PROT-789_20220131.csv
  const match = fileName.match(/PROT-\d+/);
  return match ? match[0] : null;
}

// Main function
async function main() {
  try {
    // Find new files
    const newFiles = await findNewFiles();
    console.log(`Found ${newFiles.length} new files to process`);
    
    // Process each file
    for (const file of newFiles) {
      await processFile(file);
    }
    
    console.log('Processing complete');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
main(); 