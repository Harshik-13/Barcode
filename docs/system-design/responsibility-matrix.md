# Cross-Module Responsibility Matrix

## Ownership by Module

Each module **owns** certain capabilities. Ownership means the module is the authoritative source and primary decision-maker for that capability.

| Capability | Authentication | Session Mgmt | Category Mgmt | Notification Engine | Activity Logging | Reporting | Administration |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Identity verification | **OWN** | — | — | — | — | — | — |
| Role determination | **OWN** | — | — | — | — | — | — |
| Session creation (entry) | — | **OWN** | — | — | — | — | — |
| Category selection | — | **OWN** | — | — | — | — | — |
| Session activation | — | **OWN** | — | — | — | — | — |
| Exit recording | — | **OWN** | — | — | — | — | — |
| Manual exit processing | — | **OWN** | — | — | — | — | — |
| Summary submission | — | **OWN** | — | — | — | — | — |
| Auto-completion | — | **OWN** | — | — | — | — | — |
| Session override | — | **OWN** | — | — | — | — | **TRIGGER** |
| Session archival | — | **OWN** | — | — | — | — | **TRIGGER** |
| Category CRUD | — | — | **OWN** | — | — | — | **TRIGGER** |
| Category status check | — | — | **OWN** | — | — | — | — |
| Notification creation | — | — | — | **OWN** | — | — | — |
| Notification read tracking | — | — | — | **OWN** | — | — | — |
| Audit log entries | — | — | — | — | **OWN** | — | — |
| Log querying | — | — | — | — | **OWN** | — | — |
| Attendance aggregation | — | — | — | — | — | **OWN** | — |
| Analytics computation | — | — | — | — | — | **OWN** | — |
| Report presentation | — | — | — | — | — | **OWN** | — |
| Student account mgmt | — | — | — | — | — | — | **OWN** |
| Faculty account mgmt | — | — | — | — | — | — | **OWN** |
| General configuration | — | — | — | — | — | — | **OWN** |

Key:
- **OWN** = Module is the authoritative owner
- **TRIGGER** = Module initiates the action, but another module owns the implementation

---

## Capability Distribution

### Ownership Distribution

```
Authentication  ──  2 capabilities
Session Mgmt    ──  10 capabilities (largest scope)
Category Mgmt   ──  2 capabilities
Notification    ──  2 capabilities
Activity Log    ──  2 capabilities
Reporting       ──  3 capabilities
Administration  ──  3 capabilities + 2 triggers
```

---

## No-Overlap Verification

Each capability appears in exactly one **OWN** cell. There is no overlap.

- **Authentication** does not manage sessions, categories, notifications, or reports.
- **Session Management** does not authenticate, manage categories, deliver notifications, or manage users.
- **Category Management** does not create sessions or send notifications.
- **Notification Engine** does not change session state.
- **Activity Logging** does not make operational decisions.
- **Reporting** does not change business state.
- **Administration** does not perform scanning, select categories, or submit summaries.

---

## Module Boundaries

| Module | Must Not |
|--------|----------|
| Authentication | Make business decisions based on identity beyond role determination |
| Session Management | Deliver notifications, manage user accounts, manage categories |
| Category Management | Assign categories to sessions, create sessions |
| Notification Engine | Change session state, manage users, manage categories |
| Activity Logging | Influence any business decision, filter log entries based on content |
| Reporting | Modify any business data |
| Administration | Perform normal scanning operations |

---

## Data Ownership

| Data | Owner Module | Can Be Read By |
|------|-------------|----------------|
| Student identity & role | Authentication | All modules (via identity context) |
| Session state & history | Session Management | Session Management, Reporting, Administration |
| Category catalog | Category Management | Session Management, Reporting, Administration |
| Notifications | Notification Engine | Student (via dedicated interface) |
| Activity log | Activity Logging | Administration (only) |
| User accounts | Administration | Administration, Authentication |
| Reports | Reporting | Faculty, Admin |
