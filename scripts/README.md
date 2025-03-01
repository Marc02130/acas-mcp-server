# MCP Server Scripts

This directory contains utility scripts for the MCP server.

## File Monitoring Script (upload-new-files.js)

This script is designed to monitor a directory for new data files and automatically upload them to the MCP server for processing.

### Features

- Recursively scans directories for new files
- Filters out already processed files
- Extracts experiment and protocol IDs from filenames
- Uploads files to MCP server with appropriate metadata
- Tracks processed files to avoid duplication

### Usage

```bash
# Basic usage
node upload-new-files.js

# With environment variables
WATCH_DIR=/data/raw_files MCP_URL=http://localhost:3002/api node upload-new-files.js
```

### Configuration Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WATCH_DIR` | Directory to monitor for new files | `/path/to/raw/data/directory` |
| `MCP_URL` | URL of the MCP server API | `http://mcp:3002/api` |
| `API_TOKEN` | Authentication token for MCP server | `cron-job-token` |
| `PROCESSED_MARKER` | Extension used to mark processed files | `.processed` |

### Filename Parsing

The script attempts to extract experiment and protocol IDs from filenames using regular expressions:

- Experiment ID: Looks for pattern `EXPT-\d+` (e.g., EXPT-12345)
- Protocol ID: Looks for pattern `PROT-\d+` (e.g., PROT-789)

You can customize these patterns in the script to match your specific naming conventions.

### Setup as a Cron Job

1. Make the script executable:
   ```bash
   chmod +x upload-new-files.js
   ```

2. Create a cron job to run the script at regular intervals:
   ```bash
   # Edit crontab
   crontab -e

   # Add a line to run every 5 minutes
   */5 * * * * cd /path/to/mcp-server/scripts && ./upload-new-files.js >> /var/log/mcp-upload.log 2>&1
   ```

3. For better organization, you can create a wrapper script that sets environment variables:
   ```bash
   #!/bin/bash
   # mcp-monitor.sh
   export WATCH_DIR=/data/raw_files
   export MCP_URL=http://localhost:3002/api
   export API_TOKEN=your-secure-token
   
   cd /path/to/mcp-server/scripts
   ./upload-new-files.js
   ```
   
   Then use this in crontab:
   ```
   */5 * * * * /path/to/mcp-monitor.sh >> /var/log/mcp-upload.log 2>&1
   ```

### Logging

The script logs information to the console (stdout/stderr), which can be redirected to a file:

- File discovery
- Processing steps
- Successful uploads with job IDs
- Errors with details

For production use, consider implementing a more robust logging solution.

### Security Considerations

- Store API tokens securely, not hardcoded in the script
- Ensure the watch directory has appropriate permissions
- Consider network security for communication with the MCP server
- Implement appropriate error handling and alerting 