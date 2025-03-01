/**
 * OpenAI service for RAG-based ISA-Tab generation
 */
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

// Initialize OpenAI client with better error handling and debugging
let openai;
try {
  const apiKey = process.env.OPENAI_API_KEY || config.openaiApiKey;
  
  console.log(`OpenAI API Key exists: ${!!apiKey}`);
  console.log(`OpenAI API Key length: ${apiKey ? apiKey.length : 0}`);
  
  if (!apiKey) {
    console.error('OpenAI API key is missing. Please set OPENAI_API_KEY environment variable.');
  } else {
    openai = new OpenAI({ apiKey });
    console.log('OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error.message);
}

/**
 * Generate ISA-Tab files from raw data using OpenAI
 * @param {Object} job - Job information containing file paths and metadata
 * @returns {Promise<Object>} - Generated ISA-Tab content
 */
async function generateISATab(job) {
  try {
    const { files, metadata } = job;
    
    // Read the content of each file
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(file.path, 'utf8');
        return {
          filename: file.originalName,
          content: content,
          mimeType: file.mimeType
        };
      })
    );
    
    // Create system prompt for ISA-Tab generation
    const systemPrompt = `
      You are an expert in scientific data processing and ISA-Tab format generation. 
      Your task is to convert raw experimental data into properly formatted ISA-Tab files.
      
      Use the following guidelines:
      1. Analyze the provided data files carefully.
      2. Extract relevant metadata like sample identifiers, measurements, and conditions.
      3. Create a properly formatted ISA-Tab file set that includes:
         - Investigation file (i_*.txt)
         - Study file (s_*.txt)
         - Assay file (a_*.txt) if applicable
      4. Follow ISA-Tab specifications precisely.
      
      The experimental context is:
      - Experiment ID: ${metadata.experimentId || 'Unknown'}
      - Protocol ID: ${metadata.protocolId || 'Unknown'}
      - Description: ${metadata.description || 'No description provided'}
    `;
    
    // Prepare file content for the prompt
    const fileContentText = fileContents.map(file => {
      return `File: ${file.filename} (${file.mimeType})\n\nContent:\n${file.content}\n\n`;
    }).join('---\n\n');
    
    // Create the user prompt
    const userPrompt = `
      Please analyze the following experimental data and generate appropriate ISA-Tab files:
      
      ${fileContentText}
      
      Generate the following:
      1. Investigation file (i_*.txt)
      2. Study file (s_*.txt)
      3. Assay file (a_*.txt) if needed
      
      Return the content of each file separately in a structured format.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2, // Lower temperature for more deterministic output
      max_tokens: 4000
    });
    
    // Extract and process the response
    const isaTabContent = response.choices[0].message.content;
    
    // Process and save ISA-Tab files
    const outputDir = path.join(path.dirname(files[0].path), 'isatab');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Parse the response to extract individual files
    // This is a simple implementation - may need enhancement for production
    const fileMatches = isaTabContent.match(/```\s*(?:file|txt):?\s*(i_[^.]*\.txt|s_[^.]*\.txt|a_[^.]*\.txt)\s*\n([\s\S]*?)```/gi);
    
    const outputFiles = [];
    
    if (fileMatches) {
      for (const match of fileMatches) {
        const [_, filename, content] = match.match(/```\s*(?:file|txt):?\s*(i_[^.]*\.txt|s_[^.]*\.txt|a_[^.]*\.txt)\s*\n([\s\S]*?)```/i);
        
        if (filename && content) {
          const filePath = path.join(outputDir, filename);
          await fs.writeFile(filePath, content.trim());
          outputFiles.push({
            filename,
            path: filePath
          });
        }
      }
    } else {
      // If no structured files found, save the entire response as a single file
      const filePath = path.join(outputDir, 'isatab_output.txt');
      await fs.writeFile(filePath, isaTabContent);
      outputFiles.push({
        filename: 'isatab_output.txt',
        path: filePath
      });
    }
    
    return {
      success: true,
      files: outputFiles,
      rawResponse: isaTabContent
    };
  } catch (error) {
    console.error('Error generating ISA-Tab:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || error
    };
  }
}

module.exports = {
  generateISATab
}; 