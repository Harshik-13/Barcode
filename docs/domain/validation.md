# Validation Rules

All validation rules below describe **business validation** — conditions that must be satisfied for an operation to be valid within the domain.

---

## Entry Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V1 | Student must be enrolled | Entry cannot be recorded for a non-existent or departed student |
| V2 | Student must not be suspended | A suspended student cannot start a new session |
| V3 | Student must not have an existing incomplete session | A student cannot enter the workspace while they have a session in Created, Active, or Awaiting Summary status |
| V4 | Student identity must be verifiable | Faculty must be able to confirm the student's identity through the scanning process |
| V5 | Faculty must be active | A suspended or deactivated faculty member cannot record entry |

---

## Category Selection Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V6 | Session must be in Created status | Category can only be selected after entry and before exit |
| V7 | Category must exist and be Active | Archived categories cannot be selected |
| V8 | Student must own the session | A student cannot select a category for another student's session |

---

## Exit Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V9 | Student must have a session in Created or Active status | Exit cannot be recorded for a student who has no active session or is already in Awaiting Summary |
| V10 | Faculty must be active | A suspended or deactivated faculty member cannot record exit |
| V11 | Student identity must be verifiable | Faculty must confirm identity before recording exit |

---

## Manual Exit Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V12 | Student must have a session in Created or Active status | Manual exit cannot be performed on a session that has already had exit recorded |
| V13 | Faculty must be active | A suspended or deactivated faculty member cannot perform manual exit |
| V14 | Business reason must be provided | Manual exit requires a documented reason |
| V15 | Student identity must be verifiable | Faculty must confirm identity before manual exit |

---

## Summary Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V16 | Session must be in Awaiting Summary status | Summary cannot be submitted before exit or after session is Completed |
| V17 | Summary must not be empty | A work summary requires at least some content |
| V18 | Summary must not exceed maximum length | Summaries are expected to be brief |
| V19 | Student must own the session | A student cannot submit a summary for another student's session |

---

## Notification Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V20 | Notification must belong to the student | A student cannot mark another student's notification as read |
| V21 | Notification must not already be read | A notification can be marked read only once |

---

## Category Management Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V22 | Category name must not be empty | Categories require a name |
| V23 | Category name must be unique among active categories | Duplicate category names cause confusion |
| V24 | Archived categories cannot be unarchived | Archiving is irreversible |

---

## Account Management Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V25 | Student identifier must be unique | Each student must have a unique identifier |
| V26 | Student must not already exist when creating | Duplicate accounts are not allowed |
| V27 | Only enrolled students can start sessions | Suspended and departed students cannot start sessions |

---

## Admin Override Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V28 | Admin must be active | Only active admins can override sessions |
| V29 | A reason must be provided for the override | Admin override requires a documented reason |

---

## Session Integrity Validation

| Rule | Description | Failure |
|------|-------------|---------|
| V30 | Exit time must be after entry time | A session cannot have negative duration |
| V31 | Session duration must be reasonable | Extremely short or long sessions may indicate error |
| V32 | Session transitions must follow the lifecycle | Invalid state transitions are always rejected |
| V33 | Category must be assigned before completion | No session can reach Completed without a Category |
