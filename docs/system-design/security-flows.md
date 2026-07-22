# Security Interaction Flows

## SF1: Authentication Flow

**Purpose:** Verify that an actor is who they claim to be.

```
Actor
  │
  ├── Provides identity credentials
  │     │
  │     ▼
  │   Identity Provider verifies credentials
  │     │
  │     ├── Valid → Returns verified identity
  │     │            │
  │     │            ▼
  │     │          System identifies actor's role
  │     │            │
  │     │            ▼
  │     │          Authenticated session established
  │     │
  │     └── Invalid → Rejected. Actor informed.
  │
  └── (Unverified actor cannot proceed past this point)
```

**Checkpoints:**
- Identity must be verified before any business operation.
- The actor's role is determined at authentication time and is immutable for the session duration.

**Business rules enforced:**
- Only verified actors can access the system.
- The role determines what the actor can do.

---

## SF2: Authorization Checkpoints

**Purpose:** Verify that an authenticated actor has permission to perform the requested operation.

### Checkpoint Locations

Every business workflow includes authorization checks at these points:

| Workflow | Checkpoint | What Is Verified |
|----------|-----------|-----------------|
| Entry Scan | Before session creation | Faculty role |
| Exit Scan | Before exit recording | Faculty role |
| Manual Exit | Before manual exit | Faculty role |
| Category Selection | Before category assignment | Student role |
| Summary Submission | Before summary save | Student role |
| Session Override | Before override | Admin role |
| Session Archival | Before archive | Admin role |
| User Management | Before any user change | Admin role |
| Category Management | Before any category change | Admin role |
| Reporting | Before data return | Faculty or Admin role |
| Activity Log View | Before log data return | Admin role |

### Flow

```
Actor requests operation
  │
  ├── Determine actor's role (from authenticated session)
  │
  ├── Check if role is permitted for this operation
  │     │
  │     ├── Role permitted → Continue to business logic
  │     │
  │     └── Role not permitted → Rejected. Actor informed.
  │
  └── (Every operation has exactly one authorization checkpoint)
```

**Business rules enforced:**
- Faculty cannot perform Student actions (category selection, summary submission).
- Students cannot perform Faculty actions (scanning, manual exit).
- Admin cannot perform normal scanning (but can override).
- No actor can perform operations outside their role.

---

## SF3: Ownership Verification

**Purpose:** Verify that an actor is acting on their own data when required.

### Ownership Rules

| Operation | Ownership Rule |
|-----------|---------------|
| Student views session history | Student can view only their own sessions |
| Student selects category | Student can select for their own session only |
| Student submits summary | Student can submit for their own session only |
| Student views notifications | Student can view only their own notifications |
| Faculty views any session | Faculty can view any student's session (operational need) |
| Admin views any session | Admin can view any session (administrative need) |

### Flow

```
Actor requests access to data
  │
  ├── Determine the resource owner
  │
  ├── Determine actor's role
  │     │
  │     ├── Role is Student:
  │     │     └── Actor must own the resource → Proceed or reject
  │     │
  │     ├── Role is Faculty:
  │     │     └── Actor has operational access → Proceed
  │     │
  │     └── Role is Admin:
  │           └── Actor has administrative access → Proceed
  │
  └── Ownership is enforced per the permissions matrix
```

**Business rules enforced:**
- A Student sees only their own data.
- Faculty and Admin can see all students' data (by design).
- No actor can modify data they do not own.

---

## SF4: Audit Trail Creation

**Purpose:** Record all state-changing operations for accountability.

### Operations That Produce Audit Entries

| Operation | Audit Content |
|-----------|---------------|
| Session created (entry) | Actor (Faculty), action (entry), student, timestamp |
| Category selected | Actor (Student), action (category selection), session, category |
| Exit recorded | Actor (Faculty), action (exit), student, session |
| Manual exit | Actor (Faculty), action (manual exit), student, reason |
| Summary submitted | Actor (Student), action (summary submission), session |
| Session auto-completed | Actor (System), action (auto-completion), session |
| Session overridden | Actor (Admin), action (override), session, reason |
| Session archived | Actor (Admin), action (archive), session |
| Student account created/suspended/departed | Actor (Admin), action, student |
| Faculty account created/suspended/deactivated | Actor (Admin), action, faculty |
| Category created/renamed/archived | Actor (Admin), action, category |

### Flow

```
Operation completes successfully
  │
  ▼
System creates ActivityLog entry with:
  - Actor identity
  - Action type
  - Timestamp
  - Affected entity
  - Details (what changed, reason if applicable)
  │
  ▼
ActivityLog entry is stored (immutable)
  │
  ▼
Operation result returned to actor
```

**Business rules enforced:**
- All state changes are recorded.
- The log is immutable — entries cannot be changed or deleted.
- The log is available for Admin review.

---

## SF5: Administrative Actions

**Purpose:** Ensure administrative actions are deliberate, traceable, and authorized.

### Sensitive Operations

| Operation | Authorization | Additional Controls |
|-----------|---------------|-------------------|
| Session override | Admin role only | Reason required; logged |
| Session archival | Admin role only | Only completed sessions; logged |
| User suspension | Admin role only | Warning if user has active sessions; logged |
| User departure | Admin role only | Warning if user has incomplete sessions; logged |
| Account creation | Admin role only | Duplicate check; logged |

### Flow

```
Admin requests sensitive operation
  │
  ├── Verify Admin role
  │
  ├── Validate operation-specific conditions
  │     │
  │     ├── Conditions met → Proceed
  │     │
  │     └── Conditions not met → Warn Admin, require confirmation
  │
  ├── Execute operation
  │
  ├── Log operation with Admin identity and reason
  │
  └── Confirm to Admin
```

---

## SF6: Role Enforcement Boundaries

| Boundary | What Is Protected |
|----------|------------------|
| Student → Faculty operations | Students cannot scan, perform manual exit, view all sessions, or access reports |
| Student → Admin operations | Students cannot manage users, categories, override sessions, or view activity logs |
| Faculty → Student operations | Faculty cannot select categories, submit summaries, or modify their own attendance |
| Faculty → Admin operations | Faculty cannot manage users, categories, override sessions, or archive sessions |
| Admin → Faculty operations | Admin cannot perform normal scanning or manual exit |
| Admin → Student operations | Admin cannot select categories or submit summaries |

---

## SF7: Business Approval Flows

The following operations require documented justification:

| Operation | Required Justification | Who Provides It |
|-----------|----------------------|-----------------|
| Manual Exit | Business reason for exception | Faculty |
| Session Override | Reason for correction | Admin |
| Student Departure | Reason for departure | Admin |
| Faculty Deactivation | Reason for deactivation | Admin |
