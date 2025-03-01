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

/**
 * Convert an ISA-Tab file to ACAS format using RAG with all available examples
 * @param {string} isaTabFilePath - Path to the ISA-Tab file to convert
 * @param {string} outputFormat - Desired output format (e.g., 'CustomExample', 'DoseResponse')
 * @returns {Promise<string>} - ACAS formatted content
 */
async function convertIsaTabToAcasFormat(isaTabFilePath, outputFormat = 'CustomExample') {
  try {
    console.log(`Converting ISA-Tab file ${isaTabFilePath} to ACAS format: ${outputFormat}`);
    
    // Load the input ISA-Tab file
    const isaTabContent = await fs.readFile(isaTabFilePath, 'utf8');
    
    // Get all example files from both directories
    const exampleIsaDir = path.join(__dirname, '../routes/example_isa');
    const exampleAcasDir = path.join(__dirname, '../routes/example_acas');
    
    // Read all example files
    const isaFiles = await fs.readdir(exampleIsaDir);
    const acasFiles = await fs.readdir(exampleAcasDir);
    
    // Prepare example pairs - match files by name where possible
    const examplePairs = [];
    
    // Find direct matches first (CustomExample_isa.csv -> CustomExample.csv)
    for (const isaFile of isaFiles) {
      // Extract the base name to match with ACAS file
      const baseName = isaFile.replace('_isa.csv', '');
      const matchingAcasFile = acasFiles.find(f => f === `${baseName}.sel`);
      
      if (matchingAcasFile) {
        const pair = {
          name: baseName,
          isa: path.join(exampleIsaDir, isaFile),
          acas: path.join(exampleAcasDir, matchingAcasFile)
        };
        examplePairs.push(pair);
      }
    }
    
    // Add remaining ACAS examples that don't have ISA counterparts
    // These are still useful as output format examples
    for (const acasFile of acasFiles) {
      const baseName = path.basename(acasFile, '.sel');
      const alreadyPaired = examplePairs.some(pair => pair.name === baseName);
      
      if (!alreadyPaired) {
        examplePairs.push({
          name: baseName,
          isa: null, // No ISA example
          acas: path.join(exampleAcasDir, acasFile)
        });
      }
    }
    
    console.log(`Found ${examplePairs.length} example pairs for conversion reference`);
    
    // Generate prompt sections for each example pair
    let examplesPrompt = '';
    
    for (const pair of examplePairs) {
      examplesPrompt += `\n## Example Format: ${pair.name}\n\n`;
      
      if (pair.isa) {
        const isaContent = await fs.readFile(pair.isa, 'utf8');
        examplesPrompt += `### Input (ISA-Tab format):\n\`\`\`csv\n${isaContent}\n\`\`\`\n\n`;
      }
      
      if (pair.acas) {
        const acasContent = await fs.readFile(pair.acas, 'utf8');
        examplesPrompt += `### Output (ACAS format):\n\`\`\`csv\n${acasContent}\n\`\`\`\n\n`;
      }
    }
    
    // Highlight the requested format by mentioning it specifically
    let primaryExample = '';
    const targetPair = examplePairs.find(p => p.name === outputFormat);
    if (targetPair) {
      primaryExample = `\n## Primary Target Format: ${outputFormat}\n\nPlease convert the input to match the ${outputFormat} format most closely.\n`;
    }
    
    // Construct the prompt with all examples
    const prompt = `
# Task: Convert an ISA-Tab format CSV file to ACAS format

${primaryExample}

# Reference Examples
The following examples show different ISA-Tab input formats and their corresponding ACAS output formats:
${examplesPrompt}

## Conversion Rules:
1. Extract metadata from input columns and place in the Experiment Meta Data section
2. Convert data columns properly to the Raw Data section
3. Use appropriate datatypes (Number or Text) based on the content
4. Ensure all sections are properly formatted according to the ACAS examples
5. Choose the most appropriate ACAS format based on the input data structure

## Input to Convert:
\`\`\`csv
${isaTabContent}
\`\`\`

## Output the converted ACAS format:
Your output should match the structure of the ${outputFormat} format, but adapt as needed based on the input data.
`;

    // Call OpenAI API for conversion
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Use a capable model
      messages: [
        { role: "system", content: "You are a data format conversion expert. Convert ISA-Tab format CSV files to ACAS format following the examples provided." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Lower temperature for more deterministic output
      max_tokens: 4000
    });
    
    // Extract the converted content
    const convertedContent = completion.choices[0].message.content.trim();
    
    // Clean up any markdown code block syntax if present
    const cleanContent = convertedContent.replace(/```csv\n/g, '').replace(/```/g, '');
    
    console.log('Successfully converted ISA-Tab to ACAS format');
    return cleanContent;
  } catch (error) {
    console.error('Error converting ISA-Tab to ACAS format:', error);
    throw new Error(`Failed to convert ISA-Tab to ACAS format: ${error.message}`);
  }
}

module.exports = {
  generateISATab,
  convertIsaTabToAcasFormat
}; 