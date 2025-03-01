# MCP Server Development Guide

This document provides guidance for developers working on the MCP Server.

## Development Environment Setup

### Prerequisites

- Node.js (v16.x or higher)
- npm (v6.x or higher)
- Git
- Docker and Docker Compose (for containerized development)

### Local Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Modify the `.env` file with appropriate values for your development environment:
   ```
   PORT=3002
   NODE_ENV=development
   ACAS_BASE_URL=http://localhost:3000
   ROO_BASE_URL=http://localhost:8080/acas/api/v1
   LOG_LEVEL=debug
   ```

5. Start the server in development mode:
   ```bash
   npm run dev
   ```

## Docker Development

If you prefer to use Docker for development:

1. Build the Docker image:
   ```bash
   docker build -t mcp-server .
   ```

2. Run the container:
   ```bash
   docker run -p 3002:3002 --env-file .env mcp-server
   ```

3. Alternatively, use Docker Compose with ACAS:
   ```bash
   cd ../acas
   docker-compose up
   ```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

### Writing Tests

- Place test files in the `tests/` directory
- Use the `.test.js` suffix for test files
- Follow the existing patterns for unit and integration tests
- Mock external services and dependencies as needed

## Code Style and Linting

We use ESLint for code quality and consistency:

```bash
# Run linter
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix
```

## Pull Request Process

1. Create a feature branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git commit -m "Description of changes"
   ```

3. Before submitting a PR:
   - Run tests: `npm test`
   - Run linter: `npm run lint`
   - Add or update relevant documentation
   - Make sure all CI checks pass

4. Submit a pull request to the `develop` branch

## Project Structure

```
mcp-server/
├── src/                  # Source code
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── utils/            # Helper functions
│   ├── config.js         # Configuration management
│   └── index.js          # Application entry point
├── tests/                # Test files
├── .env.example          # Example environment variables
├── .eslintrc.js          # ESLint configuration
├── package.json          # Dependencies and scripts
├── README.md             # Project overview
├── API.md                # API documentation
└── Dockerfile            # Container definition
```

## Debugging

### Local Debugging

1. Start the server in debug mode:
   ```bash
   npm run debug
   ```

2. Connect with a debugger (e.g., Chrome DevTools or VS Code)

### Docker Debugging

1. Run the container with the debug port exposed:
   ```bash
   docker run -p 3002:3002 -p 9229:9229 --env-file .env mcp-server npm run debug
   ```

2. Connect with a remote debugger to localhost:9229

## Logging

- Use the provided logger (`src/utils/logger.js`) for all logging
- Avoid using `console.log` directly
- Follow log level guidelines:
  - `error`: Application errors and exceptions
  - `warn`: Warning conditions
  - `info`: General information
  - `debug`: Detailed debug information

## Environment-Specific Behavior

The application behaves differently based on the `NODE_ENV` environment variable:

- `development`: Detailed logging, error stacks exposed
- `test`: Optimized for testing, mock external services
- `production`: Performance optimized, minimal logging 