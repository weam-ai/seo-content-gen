# Site Audit Flow Restructure

## Overview

The site audit flow has been restructured to use a new single endpoint that provides real-time chunked responses instead of the old polling-based system.

## Changes Made

### Environment Configuration

### Database Schema Changes

- **Removed columns:**

  - `audit_id` (integer)
  - `metadata` (json)
  - `progress` (varchar)

- **Added columns:**
  - `audit_report` (json) - Stores the final audit report
  - `status` (enum) - Current status: 'pending', 'in_progress', 'completed', 'failed'
  - `current_step` (text) - Current processing step description
  - `progress_steps` (text array) - Array of all progress steps
  - `error_message` (text) - Error message if audit fails

### New Endpoint

- **URL:** `http://localhost:8002/seo-audit/audits`
- **Method:** POST
- **Payload:** `{ "url": "https://example.com" }`
- **Response:** Chunked streaming response

## API Flow

### 1. Start Site Audit

```typescript
POST /projects/:projectId/site-audit
```

- Creates a new site audit record with status 'pending'
- Starts asynchronous chunked processing
- Returns immediately with audit ID

### 2. Check Progress

```typescript
GET /projects/:projectId/site-audit/progress
```

Returns:

```json
{
  "status": "in_progress",
  "current_step": "Analyzing meta tags...",
  "progress_steps": [
    "Page fetched successfully.",
    "Analyzing meta tags...",
    "Analyzing headings..."
  ],
  "error_message": null
}
```

### 3. Get Final Report

```typescript
GET /projects/:projectId/site-audit/report
```

Returns the complete audit report when status is 'completed'.

## Chunked Response Processing

The system processes chunked responses in real-time:

1. **Progress Steps:** Each line containing progress text is stored in `progress_steps` array
2. **Current Step:** The latest progress step is stored in `current_step`
3. **Final Report:** When "Done." is received, followed by JSON data, the complete report is stored
4. **Error Handling:** Any errors during processing are captured and stored

## Sample Chunked Response Flow

```
=== SEO Audit for: https://citrusbug.com ===

Page fetched successfully.

Analyzing meta tags...
Analyzing headings...
Analyzing images...
...
Done.
{
  "url": "https://citrusbug.com",
  "canonical_url": "https://citrusbug.com/",
  "analysis": {
    ...complete audit data...
  }
}
```

## Error Handling

- **Timeout:** Audits stuck for >10 minutes are automatically marked as 'failed'
- **Stream Errors:** Network or parsing errors are captured and stored
- **Async Processing:** Errors in background processing are logged and audit marked as failed

## Scheduler

A background scheduler runs every 5 minutes to:

- Find audits that have been stuck in 'pending' or 'in_progress' for >10 minutes
- Mark them as 'failed' with appropriate error message
- Log timeout events for monitoring

## Migration

Run the included migration to update the database schema:

```bash
npm run migration:run
```

The migration safely removes old columns and adds new ones while preserving existing data structure.
