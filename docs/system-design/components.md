# Component Architecture

## Logical Components

---

### C1: Authentication Component

**Purpose:** Verify actor identity and establish role-based access.

**Responsibilities:**
- Receive identity credentials from actors
- Forward credentials to Identity Provider for verification
- Receive verified identity and determine actor role
- Maintain authenticated session for the actor
- Terminate authenticated session on logout or expiry

**Inputs:** Identity credentials (from actor)

**Outputs:** Authenticated actor identity with role

**Dependencies:** Identity Provider (external)

**Boundaries:** Authentication does not manage user accounts, roles, or permissions. It only verifies identity and establishes the actor's role.

---

### C2: Session Management Component

**Purpose:** Own the WorkspaceSession lifecycle from creation through archival.

**Responsibilities:**
- Create sessions on entry (Created status)
- Transition sessions on category selection (Created → Active)
- Record exit and transition to Awaiting Summary
- Complete sessions on summary submission or auto-completion
- Support manual exit and admin override transitions
- Manage archival of completed sessions
- Enforce session lifecycle rules (no backward transitions, one incomplete session per student)
- Record all state changes in the Activity Log

**Inputs:** Entry requests, category selections, exit requests, summary submissions, override requests, archive requests

**Outputs:** Session state changes, business events (StudentEntered, CategorySelected, StudentExited, etc.)

**Dependencies:** Activity Logging Component, Notification Engine, Category Management Component

**Boundaries:** Session Management does not authenticate actors, deliver notifications, or manage categories. It uses other components for those concerns.

---

### C3: Category Management Component

**Purpose:** Maintain the catalog of work categories.

**Responsibilities:**
- Store and list active categories
- Create new categories
- Rename existing categories
- Archive categories (soft removal)
- Verify category existence and active status
- Enforce category name uniqueness

**Inputs:** Category management requests (create, rename, archive, list)

**Outputs:** Category data, category status verification

**Dependencies:** Activity Logging Component

**Boundaries:** Category Management does not assign categories to sessions — that is Session Management's responsibility. It only provides the catalog.

---

### C4: Notification Engine Component

**Purpose:** Generate and manage notifications in response to business events.

**Responsibilities:**
- Receive business events that require notification
- Create Notification objects with appropriate type and message
- Associate notifications with the correct student
- Track notification read status
- Hand off notifications to the Notification Delivery service

**Inputs:** Business events (StudentEntered, StudentExited, ReminderTriggered)

**Outputs:** Notification objects, delivery requests to Notification Delivery service

**Dependencies:** Notification Delivery service (external), Activity Logging Component

**Boundaries:** The Notification Engine creates notifications and manages their lifecycle. It does not deliver notifications — that is the responsibility of the Notification Delivery service.

---

### C5: Activity Logging Component

**Purpose:** Maintain an immutable audit trail of business events.

**Responsibilities:**
- Record all state-changing operations
- Capture actor identity, action, timestamp, affected entity, and details
- Ensure log entries are immutable (append-only)
- Provide log data for administrative review

**Inputs:** Log requests from all other components

**Outputs:** Immutable log entries, log data for querying

**Dependencies:** None

**Boundaries:** Activity Logging does not filter, interpret, or act upon log data. It records and retrieves entries only.

---

### C6: Reporting Component

**Purpose:** Provide attendance data and analytics.

**Responsibilities:**
- Aggregate session data by date range, student, category, and status
- Compute derived metrics (attendance count, category breakdown, average duration)
- Distinguish completion reasons in reports
- Provide data for student personal statistics
- Provide data for faculty and admin analytics
- Support report export

**Inputs:** Report queries with parameters

**Outputs:** Aggregated attendance data and analytics

**Dependencies:** Session Management Component

**Boundaries:** Reporting is read-only. It does not modify any business data.

---

### C7: Administration Component

**Purpose:** Manage users, categories, and system configuration.

**Responsibilities:**
- Create, suspend, reinstate, and depart student accounts
- Create, suspend, reinstate, and deactivate faculty accounts
- Manage workspace configuration
- Provide user search
- Initiate session overrides
- Initiate session archival

**Inputs:** Administrative requests

**Outputs:** Account state changes, configuration updates, override/archive actions

**Dependencies:** Session Management Component, Category Management Component, Activity Logging Component

**Boundaries:** Administration manages user lifecycles and system configuration. It delegates session overrides and archival to Session Management.

---

## Component Dependency Summary

```
Authentication  ──────►  (used by all components for identity)
     │
     ▼
Session Management  ──►  Activity Logging
     │                      ▲
     ├──► Category Mgmt     │
     │                      │
     ▼                      │
Notification Engine  ──────┘
     │
     ▼
Notification Delivery (external)
     ▲
     │
Reporting  ──────────────►  Session Management
     ▲
     │
Administration  ────►  Session Management
                  ────►  Category Management
                  ────►  Activity Logging
```

---

## Component Ownership by Entity

| Entity | Primary Component | Supporting Components |
|--------|-------------------|----------------------|
| WorkspaceSession | Session Management | Activity Logging, Notification Engine, Reporting |
| Category | Category Management | Activity Logging |
| Student (account) | Administration | Activity Logging |
| Faculty (account) | Administration | Activity Logging |
| Notification | Notification Engine | Activity Logging |
| Activity Log | Activity Logging | — |
| Report | Reporting | Session Management, Category Management |
