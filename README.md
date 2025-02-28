# MCP Server Overview

The Model Context Protocol (MCP) server is a lightweight, Node.js-based backend system designed to connect AI models with external data sources, tools, and services. It acts as a secure and standardized bridge, enabling AI applications to efficiently access resources and perform tasks.

## Key Features

- **Resource Access**: Exposes files, databases, and other resources via unique URIs.
- **Tool Invocation**: Provides executable functions for AI models to trigger specific operations.
- **Prompt Templates**: Supplies structured instructions for consistent AI inputs.
- **Secure Authentication**: Manages credentials through environment variables for enhanced security.
- **Scalability**: Leverages Node.js for efficient handling of concurrent requests.

## Technologies

- **Node.js**: Powers the core runtime.
- **Express.js**: Handles API routing and middleware.
- **JSON-RPC 2.0**: Ensures structured communication.
- **OAuth 2.1**: Optional framework for secure access control.

## Integration

The MCP server integrates seamlessly with the Assay Capture and Analysis System (ACAS), utilizing the ACAS roo-server for database interactions to maintain schema consistency and streamline functionality.

## Deployment

- Deployed as a container, configured to work with ACAS containers.
- Uses environment variables for flexible and secure configuration.

## File Monitoring & Processing

The MCP server includes a file monitoring script (`scripts/upload-new-files.js`) that can be used to watch directories for new files and automatically process them:

### How It Works

1. The script scans a specified directory for new files
2. Detected files are read, encoded, and sent to the MCP server for processing
3. Processed files are marked (with a `.processed` extension) to avoid reprocessing
4. Results are stored in the MCP server and can be accessed via API

### Configuration

The script can be configured using environment variables:

- `WATCH_DIR`: Directory to monitor for new files (default: '/path/to/raw/data/directory')
- `MCP_URL`: URL of the MCP server API (default: 'http://mcp:3002/api')
- `API_TOKEN`: Authentication token for MCP server (default: 'cron-job-token')
- `PROCESSED_MARKER`: Extension used to mark processed files (default: '.processed')

### Setting Up as a Cron Job

1. Make the script executable:
   ```bash
   chmod +x scripts/upload-new-files.js
   ```

2. Create a cron job to run the script at regular intervals:
   ```bash
   # Edit crontab
   crontab -e

   # Add a line to run every 5 minutes
   */5 * * * * cd /path/to/mcp-server && ./scripts/upload-new-files.js >> /var/log/mcp-upload.log 2>&1
   ```

3. Configure environment variables by creating a `.env` file or setting them in the cron job:
   ```bash
   */5 * * * * export WATCH_DIR=/data/raw_files; export MCP_URL=http://localhost:3002/api; cd /path/to/mcp-server && ./scripts/upload-new-files.js >> /var/log/mcp-upload.log 2>&1
   ```

## Important Notes

- Verify permissions for resource and tool access.
- Keep dependencies updated to address security and compatibility.
- Monitor performance and logs for optimal operation.

This server is ideal for developers building AI-driven applications that require robust, secure, and scalable integration with external systems.


# Node Package Manager
Jest depends on old versions in-flight and glob. lru-cache and glob are installed for general use. Errors will be thrown for in-flight and glob due to jest.

```bash
npm install express dotenv cors helmet jsonwebtoken morgan jest supertest express-validator eslint
npm install lru-cache winston nodemon
npm install glob@latest
```


