/**
 * ACAS integration service for submitting ISA-Tab files to GenericDataParser
 */
const axios = require('axios');
const fsPromises = require('fs').promises;
const FormData = require('form-data');
const path = require('path');
const config = require('../config');
const openaiService = require('./openai-service');

/**
 * Submit generated ISA-Tab files to ACAS GenericDataParser
 * @param {Object} job - The job containing ISA-Tab files to submit
 * @param {boolean} dryRunMode - Whether to validate only (true) or actually import (false)
 * @returns {Promise<Object>} - ACAS GenericDataParser response
 */
async function submitToGenericDataParser(job, dryRunMode = true) {
  try {
    if (!job.result || !job.result.isaTabFiles || job.result.isaTabFiles.length === 0) {
      throw new Error('No ISA-Tab files found to submit to ACAS');
    }

    // Get the main ISA-Tab file (investigation file)
    const investigationFile = job.result.isaTabFiles.find(file => 
      file.filename.startsWith('i_') || file.filename === 'isatab_output.txt'
    );
    
    if (!investigationFile) {
      throw new Error('No investigation file found in ISA-Tab output');
    }

    // Calculate absolute path to the file
    const isaTabFilePath = path.join(process.cwd(), 'uploads', investigationFile.path);
    console.log(`Converting ISA-Tab file: ${isaTabFilePath}`);
    
    // Determine ACAS format based on the data
    const outputFormat = 'CustomExample'; // Default format, can be dynamic based on data
    
    // Convert ISA-Tab to ACAS format using OpenAI
    const acasContent = await openaiService.convertIsaTabToAcasFormat(isaTabFilePath, outputFormat);
    
    // Save the converted ACAS file
    const acasFilename = `${path.basename(investigationFile.filename, path.extname(investigationFile.filename))}_acas.csv`;
    const acasFilePath = path.join(process.cwd(), 'uploads', job.id, 'acas', acasFilename);
    
    // Ensure the directory exists
    await fsPromises.mkdir(path.dirname(acasFilePath), { recursive: true });
    
    // Write the converted content
    await fsPromises.writeFile(acasFilePath, acasContent);
    
    console.log(`Converted ACAS file saved to: ${acasFilePath}`);
    
    // Step 1: Authenticate with ACAS to get a session - following Python client approach
    console.log('Authenticating with ACAS...');
    const authSession = axios.create();
    
    const loginResponse = await authSession.post(
      `${config.acasBaseUrl}/login`, 
      { 
        username: 'admin',
        password: 'admin'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        maxRedirects: 0,
        validateStatus: status => status === 200 || status === 302
      }
    );
    
    // Check for successful authentication
    if (loginResponse.status === 302 && loginResponse.headers.location === '/login') {
      throw new Error('Failed to login to ACAS. Please check credentials.');
    }
    
    console.log('Authentication successful');
    
    // Extract cookies from response for session maintenance
    const cookies = loginResponse.headers['set-cookie'] || [];
    console.log('Cookies received:', cookies.length);
    
    if (cookies.length === 0) {
      throw new Error('No cookies received after successful authentication');
    }
    
    // Read the file content for submission
    const fileContent = await fsPromises.readFile(acasFilePath, 'utf8');
    
    // Create FormData with essential parameters
    const formData = new FormData();
    formData.append('fileToParse', fileContent, acasFilename);
    formData.append('dryRunMode', dryRunMode.toString());
    formData.append('user', 'admin');
    formData.append('testMode', 'true');
    
    console.log('FormData created with file and user parameters');
    
    // Submit using the authenticated session
    const apiUrl = `${config.acasBaseUrl}/api/genericDataParser`;
    console.log(`Submitting to API endpoint: ${apiUrl}`);
    
    // Send the request with the session cookies
    const response = await authSession.post(
      apiUrl,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Cookie: cookies.join('; ')
        },
        withCredentials: true
      }
    );
    
    console.log('Response received, status:', response.status);
    
    // Process the response
    if (response.data.hasError) {
      console.log('GenericDataParser full response:', JSON.stringify(response.data, null, 2));
      
      throw new Error(`ACAS GenericDataParser error: ${
        response.data.errorMessages?.[0]?.message || 
        'Unknown error processing ISA-Tab files'
      }`);
    }

    return {
      success: true,
      message: "ISA-Tab successfully converted and submitted to ACAS",
      acasFile: {
        path: acasFilePath,
        filename: acasFilename,
        format: outputFormat
      },
      dryRun: dryRunMode,
      acasResponse: response.data,
      experimentCode: response.data.results?.experimentCode,
      htmlSummary: response.data.results?.htmlSummary
    };
    
  } catch (error) {
    console.error('Error processing ISA-Tab for ACAS:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || error
    };
  }
}

module.exports = {
  submitToGenericDataParser
}; 