# Query Contracts

## Pagination

All list endpoints support pagination via query parameters.

### Request Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| page | int | 1 | — | Page number (1-indexed) |
| limit | int | 20 | 100 | Items per page |

### Response Format

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Fields:**
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of items matching the query (before pagination)
- `totalPages`: Ceiling of total / limit

### Pagination Rules

1. **page** must be >= 1 (400 otherwise).
2. **limit** must be between 1 and 100 (400 otherwise).
3. If total = 0, `data` is an empty array and `totalPages` = 0.
4. If page exceeds totalPages, `data` is an empty array (not an error).

---

## Sorting

### Request Parameters

| Parameter | Type | Default | Example |
|-----------|------|---------|---------|
| sort | string | varies by endpoint | `createdAt` |
| order | string | desc | `asc` or `desc` |

### Permitted Sort Fields by Endpoint

| Endpoint | Sort Fields |
|----------|-------------|
| GET /students | name, roll, createdAt, status |
| GET /faculty | name, email, createdAt, status |
| GET /admins | name, email, createdAt, status |
| GET /sessions | entryTime, exitTime, createdAt, status, student.name |
| GET /categories | name, createdAt, status |
| GET /notifications | createdAt, type, isRead |
| GET /activity-logs | createdAt, actorType, action, entityType |

### Sorting Rules

1. Only fields listed in the permitted list are accepted.
2. Invalid sort fields return 400 with INVALID_SORT_FIELD.
3. `order` defaults to `desc` for time-based fields, `asc` for name-based fields.
4. Multiple sort fields are not supported in V1 (single field sort only).

---

## Filtering

### Filter Parameters by Endpoint

| Endpoint | Filters | Type |
|----------|---------|------|
| GET /students | status, search | exact match, text search |
| GET /faculty | status, search | exact match, text search |
| GET /admins | status | exact match |
| GET /sessions | status, studentId, facultyId, categoryId, dateFrom, dateTo | exact match, range |
| GET /categories | status | exact match |
| GET /notifications | isRead | boolean match |
| GET /activity-logs | actorType, actorId, entityType, entityId, action, dateFrom, dateTo | exact match, range |

### Filter Semantics

| Filter Type | Example | Behavior |
|-------------|---------|----------|
| Exact match | `status=ACTIVE` | WHERE status = 'ACTIVE' |
| Text search | `search=alice` | WHERE name LIKE '%alice%' OR roll LIKE '%alice%' |
| Range (dateFrom) | `dateFrom=2026-07-01` | WHERE entry_time >= '2026-07-01' |
| Range (dateTo) | `dateTo=2026-07-22` | WHERE entry_time <= '2026-07-22T23:59:59' |
| Boolean | `isRead=true` | WHERE is_read = 1 |

### Filter Composition

Multiple filters are combined with AND:

```
GET /sessions?status=COMPLETED&categoryId=1&dateFrom=2026-07-01
→ WHERE status = 'COMPLETED' AND category_id = 1 AND entry_time >= '2026-07-01'
```

---

## Search

### Search Behavior

- **Case-insensitive** substring matching.
- Applied to **name** and **roll** fields (or applicable identifier fields).
- Searched with LIKE '%term%' (SQLite) or ILIKE (PostgreSQL).
- Only textual fields are searched; no full-text search engine is used in V1.

### Endpoints Supporting Search

| Endpoint | Searchable Fields |
|----------|-------------------|
| GET /students | name, roll |
| GET /faculty | name, email |

---

## Field Selection (Future)

Field selection (e.g., `?fields=id,name,status`) is not supported in V1. All list endpoints return a fixed schema.

---

## Query Examples

### Student List with Filters
```
GET /api/v1/students?page=1&limit=20&status=ENROLLED&search=alice&sort=name&order=asc
```

### Session List with Date Range
```
GET /api/v1/sessions?page=1&limit=50&status=COMPLETED&dateFrom=2026-07-01&dateTo=2026-07-22&sort=entryTime&order=desc
```

### Activity Log with Filtering
```
GET /api/v1/activity-logs?actorType=FACULTY&entityType=WORKSPACE_SESSION&dateFrom=2026-07-01&page=1&limit=100&sort=createdAt&order=desc
```

---

## Rate Limiting

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Session endpoints | 60 requests | 1 minute |
| All other endpoints | 120 requests | 1 minute |

Rate limit exceeded responses include:
- Status: 429 Too Many Requests
- Header: `Retry-After: <seconds>`

---

## Response Compression

All API responses are compressed with gzip when the client sends `Accept-Encoding: gzip` header.

---

## Response Caching

| Endpoint | Cache Behavior | Cache Duration |
|----------|---------------|----------------|
| GET /categories | Cacheable (rarely changes) | 5 minutes |
| GET /students | Cacheable with authorization | 1 minute |
| GET /sessions/occupancy | Cacheable | 30 seconds |
| All others | Not cached | — |

Cache headers:
- `Cache-Control: public, max-age=300` for cacheable responses
- `Cache-Control: no-store` for non-cacheable responses
