# MCP Server Overview

The Microchemistry Processing (MCP) server is a lightweight, Node.js-based backend system designed to process experimental data and generate ISA-Tab files for import into the ACAS (Assay Capture and Analysis System).

## Key Features

- **File Upload**: Securely upload raw experimental data in various formats (CSV, Excel, etc.)
- **OpenAI Processing**: Uses OpenAI to analyze raw data and generate ISA-Tab files
- **Job Management**: Track the status and results of data processing jobs
- **ACAS Integration**: Seamless integration with the ACAS ecosystem

## Technologies

- **Node.js**: Powers the core runtime
- **Express.js**: Handles API routing and middleware
- **OpenAI API**: Provides AI capabilities for data processing
- **Multer**: Manages file uploads
- **JSON Web Tokens**: Handles authentication

## Deployment

- Deployed as a container, configured to work with ACAS containers
- Uses environment variables for flexible and secure configuration
- Shares the ACAS filestore volume for seamless file access

## Configuration

### Environment Variables

The MCP server requires the following environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key for generating ISA-Tab files
- `OPENAI_MODEL`: The OpenAI model to use (default: "gpt-4o-mini")
- `PORT`: The port to run the server on (default: 3002)
- `ACAS_BASE_URL`: URL of the ACAS server (default: http://acas:3000)
- `ROO_BASE_URL`: URL of the ROO server (default: http://roo:8080/acas/api/v1)

### Setting Up Environment Variables

#### Development

For local development, create a `.env` file in the root directory with these variables:

```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

#### Production/Docker Deployment

When using Docker, you should pass environment variables securely:

1. **Export sensitive API keys in your shell before building/running:**

```bash
# Export the API key (sensitive information)
export OPENAI_API_KEY="your_api_key_here"

# Build and run with the variables
docker compose build
docker compose up -d
```

2. **Use docker-compose.yml for non-sensitive environment variables:**

```yaml
services:
  mcp:
    build:
      context: ../mcp-server
      args:
        OPENAI_API_KEY: ${OPENAI_API_KEY}
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=gpt-4o-mini  # Non-sensitive, can be directly in docker-compose.yml
```

> **Security Note**: Never commit API keys to version control. Always use environment variables
> or secure secret management systems for sensitive information in production environments.

## API Usage

The MCP server exposes a RESTful API for file processing:

1. **Upload files**: POST to `/api/v1/process/upload` with multipart form data
2. **Check job status**: GET `/api/v1/process/jobs/{jobId}`

See the [API Documentation](./API.md) for detailed information.

## Development

To set up a development environment:

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables
4. Start the server: `npm run dev`

## Docker

The MCP server is designed to run as a container alongside other ACAS components:

```bash
docker compose build mcp
docker compose up -d mcp
```

## File Storage

The MCP server uses the shared ACAS filestore volume for:
- Storing uploaded files
- Generating ISA-Tab output files
- Providing access to files for other ACAS components

## Security

- Files are validated for size and type
- Authentication is required for all API endpoints
- Environment variables are used for sensitive configuration

# Node Package Manager
Jest depends on old versions in-flight and glob. lru-cache and glob are installed for general use. Errors will be thrown for in-flight and glob due to jest.

```bash
npm install express dotenv cors helmet jsonwebtoken morgan jest supertest express-validator eslint
npm install lru-cache winston nodemon
npm install glob@latest
```


