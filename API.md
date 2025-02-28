# MCP Server API Documentation

This document describes the available API endpoints for the MCP (Microchemistry Processing) Server.

## Base URL

All API endpoints are prefixed with `/api`

## Authentication

Currently, the API relies on environment variables for authentication with ROO and ACAS services.

## Available Endpoints

### Health Check

**GET** `/api/health`

Returns the current health status of the server.

#### Response

```json
{
  "status": "ok",
  "timestamp": "2023-05-22T12:34:56.789Z",
  "uptime": 3600
}
```

### File Processing Endpoints

**POST** `/api/process/raw-data`

Process raw experimental data and convert to ISA-Tab format.

#### Request Body

```json
{
  "experimentId": "EXPT-000001",
  "protocolId": "PROT-000001",
  "rawData": "...[base64 encoded file data]..."
}
```

#### Response

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Processing job created"
}
```

### Job Management

**GET** `/api/jobs/:jobId`

Get the status and results of a processing job.

#### Parameters

- `jobId`: The ID of the job to retrieve

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "createdAt": "2023-05-22T12:34:56.789Z",
  "completedAt": "2023-05-22T12:35:56.789Z",
  "result": {
    "isaTabFile": "...[base64 encoded file data]...",
    "metadata": {
      "experimentId": "EXPT-000001",
      "protocolId": "PROT-000001"
    }
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
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error 