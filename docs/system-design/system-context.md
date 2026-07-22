# System Context

## High-Level Overview

The 8Hour Workspace Attendance System is a role-based platform that records student attendance and work activity in a startup workspace. The system manages the full lifecycle of workspace sessions — from entry through category selection, exit, summary submission, and archival.

---

## Primary Actors

| Actor | Role in System |
|-------|---------------|
| **Student** | Attends workspace, selects work category, submits work summary, receives notifications |
| **Faculty** | Records entry and exit via scanning, performs manual exit as exception, monitors occupancy |
| **Admin** | Manages users, categories, and configuration; performs session overrides and archival |
| **System** | Enforces business rules, manages lifecycle transitions, generates notifications, records activity log |

---

## External Services

| Service | Interaction | Data Direction |
|---------|-------------|----------------|
| **Identity Provider** | Verifies actor identity on login | Inbound: identity confirmation |
| **Notification Delivery** | Delivers notifications to students | Outbound: notification content |

---

## System Boundaries

```
                      ┌─────────────────────────────────────┐
                      │     8Hour Workspace System          │
                      │                                     │
                      │  ┌───────────────────────────────┐  │
                      │  │    Authentication Module      │  │
                      │  └───────────┬───────────────────┘  │
                      │              │                      │
                      │  ┌───────────▼───────────────────┐  │
                      │  │     Session Management        │  │
                      │  │  (entry, exit, lifecycle)     │  │
                      │  └──┬────────┬─────────┬─────────┘  │
                      │     │        │         │            │
                      │  ┌──▼──┐ ┌───▼───┐ ┌───▼────────┐  │
                      │  │Cat  │ │Notif │ │ Activity   │  │
                      │  │Mgmt │ │Engine│ │ Logging    │  │
                      │  └─────┘ └───────┘ └────────────┘  │
                      │                                     │
                      │  ┌───────────┐ ┌────────────────┐  │
                      │  │ Reporting │ │ Administration │  │
                      │  └───────────┘ └────────────────┘  │
                      │                                     │
                      └─────────────────────────────────────┘
                               │              │
                    ┌──────────▼──┐    ┌──────▼──────────┐
                    │  Identity   │    │   Notification  │
                    │  Provider   │    │   Delivery      │
                    └─────────────┘    └─────────────────┘
```

---

## Internal Modules

| Module | Primary Responsibility |
|--------|----------------------|
| **Authentication** | Verify actor identity, establish session identity, determine role |
| **Session Management** | Manage WorkspaceSession lifecycle: entry, category selection, exit, summary, completion, archival |
| **Category Management** | Maintain work categories: create, rename, archive, list active |
| **Notification Engine** | Generate notifications in response to business events, manage read status |
| **Activity Logging** | Record immutable audit trail of state-changing operations |
| **Reporting** | Provide attendance data, analytics, and historical views |
| **Administration** | Manage users (students, faculty), system configuration, session overrides |

---

## Information Flow (High-Level)

```
Identity Provider ──► Authentication ──► Session Management
                                              │
                            ┌─────────────────┼──────────────────┐
                            ▼                 ▼                  ▼
                     Category Mgmt      Notification        Activity Log
                            │                 │                  │
                            └────────┬────────┘──────────────────┘
                                     ▼
                                Reporting
                                     │
                                     ▼
                                Administration
```

---

## Key Architectural Principles

1. **Session-Centric.** All workflows revolve around the WorkspaceSession lifecycle.
2. **Actor-Separated.** Student, Faculty, and Admin have distinct responsibilities that never overlap.
3. **Event-Driven.** Business events trigger notifications, logging, and state transitions.
4. **Immutable Audit Trail.** All state changes are recorded and never modified.
5. **Offline-Resilient.** Core scanning operations can tolerate network interruptions without violating business rules.
