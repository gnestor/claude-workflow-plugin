# Air API Endpoints Reference

## Base URL

```
https://api.air.inc/v1
```

## Authentication

All requests require two headers:
- `x-api-key`: Your Air API key
- `x-air-workspace-id`: Your workspace ID

## Endpoints

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assets` | List assets with filtering |
| GET | `/assets/:assetId` | Get asset details |
| DELETE | `/assets/:assetId` | Delete an asset |
| PUT | `/assets/:assetId/customfields/:customFieldId` | Update custom field value |
| GET | `/assets/:assetId/versions` | List asset versions |
| GET | `/assets/:assetId/versions/:versionId` | Get version details |
| PATCH | `/assets/:assetId/versions/:versionId` | Update version metadata |
| GET | `/assets/:assetId/versions/:versionId/download` | Get download URL |
| POST | `/assets/:assetId/versions/:versionId/tags` | Add tag to version |
| DELETE | `/assets/:assetId/versions/:versionId/tags/:tagId` | Remove tag |
| GET | `/assets/:assetId/boards` | List parent boards |

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/boards` | List all boards |
| POST | `/boards` | Create board |
| GET | `/boards/:boardId` | Get board details |
| PATCH | `/boards/:boardId` | Update board |
| DELETE | `/boards/:boardId` | Delete board |
| POST | `/boards/:boardId/assets` | Add assets to board |
| DELETE | `/boards/:boardId/assets/:assetId` | Remove asset from board |
| GET | `/boards/:boardId/guests` | List board guests |
| POST | `/boards/:boardId/guests` | Add guest |
| PATCH | `/boards/:boardId/guests/:guestId` | Update guest role |
| DELETE | `/boards/:boardId/guests/:guestId` | Remove guest |

### Custom Fields

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customfields` | List custom fields |
| POST | `/customfields` | Create custom field |
| GET | `/customfields/:customFieldId` | Get field details |
| PATCH | `/customfields/:customFieldId` | Update field |
| DELETE | `/customfields/:customFieldId` | Delete field |
| POST | `/customfields/:customFieldId/values` | Add select option |
| PATCH | `/customfields/:customFieldId/values/:valueId` | Update option |
| DELETE | `/customfields/:customFieldId/values/:valueId` | Delete option |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List tags |
| POST | `/tags` | Create tag |
| PATCH | `/tags/:tagId` | Update tag |
| DELETE | `/tags/:tagId` | Delete tag |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/uploads` | Upload file (< 5GB) |
| POST | `/uploads/uploadPart` | Upload multipart chunk |
| POST | `/uploads/completeMultipart` | Complete multipart upload |

### Imports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/imports` | Import from URL |
| GET | `/imports/:importId/status` | Check import status |

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | List available roles |

## Request/Response Formats

### Standard Response Structure

```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "cursor": "next-page-token"
  },
  "total": 100
}
```

### Pagination

Use cursor-based pagination:
- `limit`: Number of items per page (default: 100)
- `cursor`: Token from previous response

### Custom Field Types

| Type | Description |
|------|-------------|
| `single-select` | Single choice from options |
| `multi-select` | Multiple choices from options |
| `plain-text` | Free-form text |
| `date` | Date value |

### Import Status Values

| Status | Description |
|--------|-------------|
| `pending` | Import queued |
| `inProgress` | Import in progress |
| `succeeded` | Import completed |
| `failed` | Import failed |

### Import Error Types

| Error | Description |
|-------|-------------|
| `SOURCE_FILE_NOT_FOUND` | Source URL returned 404 |
| `SOURCE_URL_BLOCKED` | URL blocked by policy |
| `SOURCE_URL_INVALID` | Invalid URL format |
| `PROCESS_TIMED_OUT` | Import timed out |

## Rate Limits

The API has rate limits to prevent abuse. If you receive a 429 status code:
1. Wait before retrying
2. Implement exponential backoff
3. Reduce request frequency

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common HTTP status codes:
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limited
- `500` - Internal server error
