# ISA-Tab Generation with OpenAI

This document describes how the MCP server generates ISA-Tab files from experimental data using OpenAI.
https://isa-specs.readthedocs.io/en/latest/isatab.html

## Overview

The ISA-Tab generation process has the following steps:

1. User uploads experimental data (CSV, Excel, etc.)
2. Files are stored in a job-specific directory
3. The OpenAI service reads and processes the file content
4. OpenAI generates ISA-Tab files based on the data
5. The generated files are stored in the shared filestore
6. Job status and file paths are returned to the client

## OpenAI Integration

The MCP server uses the OpenAI API to analyze the experimental data and generate properly formatted ISA-Tab files. The implementation:

1. Uses the OpenAI SDK to communicate with the API
2. Constructs a detailed prompt with instructions on ISA-Tab format
3. Includes the experiment metadata in the context
4. Parses the response to extract individual ISA-Tab files
5. Saves the files to the appropriate directory

## ISA-Tab File Format

ISA-Tab consists of three main file types:

1. **Investigation file** (`i_*.txt`): Contains information about the overall investigation
2. **Study file** (`s_*.txt`): Describes the study subjects and sample collection
3. **Assay file** (`a_*.txt`): Contains the measurements and analysis results

The OpenAI model is instructed to generate these files according to the official ISA-Tab specification.

## Customization

The ISA-Tab generation can be customized by:

1. Modifying the system prompt in the OpenAI service
2. Adjusting the temperature parameter for more/less creative responses
3. Changing the model used (e.g., GPT-4, GPT-3.5-Turbo)

## Testing

To test the ISA-Tab generation:

1. Upload a sample data file
2. Check the job status to see when processing is complete
3. Examine the generated ISA-Tab files in the job's `isatab` directory
4. Verify that the files can be imported into ACAS

## Troubleshooting

Common issues and solutions:

- **Generation fails**: Check the OpenAI API key and error message
- **Files are not properly formatted**: Adjust the system prompt with more specific instructions
- **Missing information**: Make sure all required metadata is provided in the upload request 