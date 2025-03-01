# MCP Server API Documentation

This document describes the available API endpoints for the MCP (Microchemistry Processing) Server.

## API Versioning

The MCP Server uses path-based versioning. All endpoints are prefixed with `/api/v1/`.

Legacy (non-versioned) endpoints are still supported for backward compatibility but may be deprecated in future releases.

## Base URL

- Current version: `/api/v1`
- Legacy (non-versioned): `/api`

## Authentication

The API supports two authentication methods:

1. **API Token Authentication**: For server-to-server or script-based access
   - Include `X-API-Token` header with a valid token
   - Example: `X-API-Token: cron-job-token`

2. **Session-based Authentication**: For browser-based access
   - Uses cookies from ACAS login session
   - Delegates authentication to the roo-server

## Available Endpoints

### Health Check

**GET** `/api/v1/health`

Returns the current health status of the server.

#### Response

```json
{
  "status": "ok",
  "timestamp": "2023-05-22T12:34:56.789Z",
  "uptime": 3600,
  "version": "v1"
}
```

### Authentication Test Routes

**GET** `/api/v1/auth/public`

A public endpoint that doesn't require authentication.

#### Response

```json
{
  "message": "This is a public endpoint that anyone can access"
}
```

**GET** `/api/v1/auth/protected`

A protected endpoint that requires authentication.

#### Response

```json
{
  "message": "You have accessed a protected endpoint",
  "user": {
    "name": "User Name",
    "roles": ["role1", "role2"],
    "authenticatedVia": "session"
  }
}
```

**GET** `/api/v1/auth/admin`

An admin endpoint that requires the 'ROLE_ACAS-ADMINS' role.

#### Response

```json
{
  "message": "You have accessed an admin endpoint",
  "user": {
    "name": "Admin User",
    "roles": ["ROLE_ACAS-ADMINS"],
    "authenticatedVia": "session"
  }
}
```

### File Processing Endpoints

**POST** `/api/v1/process/upload`

Upload experimental data files for processing with OpenAI.

#### Request

- Content-Type: `multipart/form-data`

#### Form Fields

- `files`: One or more data files (CSV, Excel, text formats supported)
- `experimentId`: The experiment identifier (e.g., "EXPT-000001")
- `protocolId`: The protocol identifier (e.g., "PROT-000001") 
- `description`: Optional description of the data

#### Response

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Files uploaded and processing started",
  "files": ["experiment_data.csv"]
}
```

### Job Management

**GET** `/api/v1/process/jobs/:jobId`

Get the status and results of a processing job.

#### Parameters

- `jobId`: The ID of the job to retrieve

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "files": [
    {
      "originalName": "experiment_data.csv",
      "filename": "experiment_data.csv",
      "path": "/path/to/upload/directory/experiment_data.csv",
      "size": 1024,
      "mimeType": "text/csv"
    }
  ],
  "metadata": {
    "experimentId": "EXPT-000001",
    "protocolId": "PROT-000001",
    "description": "Sample experiment data"
  },
  "createdAt": "2023-05-22T12:34:56.789Z",
  "createdBy": "system",
  "completedAt": "2023-05-22T12:35:56.789Z",
  "result": {
    "message": "Processing completed successfully",
    "isaTabFiles": [
      {
        "filename": "i_investigation.txt",
        "path": "550e8400-e29b-41d4-a716-446655440000/isatab/i_investigation.txt"
      },
      {
        "filename": "s_study.txt",
        "path": "550e8400-e29b-41d4-a716-446655440000/isatab/s_study.txt"
      },
      {
        "filename": "a_assay.txt",
        "path": "550e8400-e29b-41d4-a716-446655440000/isatab/a_assay.txt"
      }
    ]
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": true,
  "message": "Error description",
  "details": "Additional error details"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error 