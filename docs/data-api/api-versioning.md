# API Versioning

## Versioning Strategy

The API uses **URL path prefix versioning**:

```
/api/v1/sessions
/api/v2/sessions
```

### Why URL Path Versioning

1. **Explicit:** The version is visible in every request and response.
2. **Cache-friendly:** Different versions have different cache keys.
3. **Easy to route:** Load balancers and API gateways can route based on the path prefix.
4. **No header negotiation:** No `Accept-Version` header required (simpler client implementation).

---

## Deprecation Policy

### Version Lifecycle

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  Active  │────▶│  Deprecated   │────▶│  Sunset    │
│ Version  │     │  (6 months)   │     │  (removed) │
└──────────┘     └──────────────┘     └────────────┘
```

| Phase | Duration | Behavior |
|-------|----------|----------|
| Active | — | Full support, bug fixes, documentation |
| Deprecated | 6 months | No new features, critical bug fixes only, deprecation warnings in response headers |
| Sunset | — | Returns 410 Gone |

### Deprecation Headers

When a deprecated version is accessed, the API includes:

```
Sunset: Sat, 22 Jan 2027 00:00:00 GMT
Deprecation: true
Link: </api/v2/sessions>; rel="successor-version"
```

---

## Backward Compatibility

### What Constitutes a Breaking Change

| Change | Breaking? | Notes |
|--------|-----------|-------|
| Removing a field from response | Yes | — |
| Renaming a field in response | Yes | — |
| Adding a required field to request | Yes | — |
| Changing a field type | Yes | — |
| Changing error code values | Yes | — |
| Removing an endpoint | Yes | — |
| Changing HTTP method | Yes | — |
| Adding a field to response | No | Clients must ignore unknown fields |
| Adding a new endpoint | No | — |
| Adding an optional field to request | No | — |
| Changing pagination defaults | No | If backward compatible |

### Compatibility Guarantees

1. **Within a version:** No breaking changes. All changes within v1 are backward-compatible additive changes.
2. **Between versions:** No compatibility guarantee. Clients must migrate explicitly.
3. **Deprecation period:** Minimum 6 months between deprecation and sunset.

---

## Migration Guide

### V1 → V2 Migration

When V2 is released:

1. V1 is marked as deprecated.
2. A migration guide is published in the API documentation.
3. All V1 endpoints continue to work for 6 months.
4. Deprecation headers are added to all V1 responses.
5. After 6 months, V1 returns 410 Gone.

### Client Migration Checklist

- [ ] Update all API paths from `/api/v1/` to `/api/v2/`
- [ ] Review the V2 changelog for breaking changes
- [ ] Update field mappings if fields were renamed
- [ ] Update any error handling if error codes changed
- [ ] Test against V2 staging environment

---

## Changelog Format

Each version has a changelog maintained in the API documentation:

```
## v1.0.0 (2026-07-22)
- Initial API release

## v1.1.0 (2026-09-01)
- Added sort parameter to GET /students
- Added search parameter to GET /faculty
- Added unread-count endpoint for notifications
```

---

## Version Mapping

| API Version | Minimum App Version | Status | Release Date |
|-------------|-------------------|--------|--------------|
| v1 | 1.0.0 | Active | 2026-07-22 |

---

## Design Principles

1. **One active version at a time.** Only v1 is active. V2 is not planned until a clear need arises.
2. **Extend before breaking.** Prefer additive changes (new fields, new endpoints) over breaking changes.
3. **No internal version coupling.** Internal refactoring does not require an API version bump.
4. **Document every change.** Every API change is documented with a changelog entry.
