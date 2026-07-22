# Constraints

Constraints are invariant rules that must always hold true. Unlike business rules (which describe allowed behavior), constraints describe conditions that can never be violated.

---

## Invariant 1: One Incomplete Session Per Student

**Statement:** A Student must have at most one WorkspaceSession in Created, Active, or Awaiting Summary status at any given time.

**Why:** A student can physically be in only one place. Multiple simultaneous incomplete sessions indicate a data error or abuse.

**Applies to:** Session creation.

---

## Invariant 2: Entry Precedes Exit

**Statement:** The exit time of a WorkspaceSession must always be later than its entry time.

**Why:** A session represents a time interval from entry to exit. Negative or zero duration is logically impossible.

**Applies to:** Session exit recording.

---

## Invariant 3: Session Status Progression Is Forward-Only

**Statement:** A WorkspaceSession status can only move forward: Created → Active → Awaiting Summary → Completed → Archived. No backward transitions are allowed.

**Why:** Once a session progresses past a state, reverting would invalidate business events that already occurred (notifications sent, summaries written, manual exit reasons recorded).

**Applies to:** All session status transitions.

---

## Invariant 4: Completed and Archived Sessions Are Immutable

**Statement:** Once a WorkspaceSession reaches Completed or Archived status, its attributes (entry time, exit time, category, summary, completion reason) cannot be modified.

**Why:** Completed sessions represent finalized historical records. Modifying them undermines audit integrity.

**Applies to:** Session modification after finalization.

---

## Invariant 5: Session Belongs to One Student

**Statement:** A WorkspaceSession is associated with exactly one Student and this relationship cannot change.

**Why:** A session records one student's attendance. Transferring sessions between students would invalidate attendance records.

**Applies to:** Session ownership.

---

## Invariant 6: Category Required for Completion

**Statement:** Every WorkspaceSession must have a Category assigned before reaching the Completed or Archived state. "Uncategorized" is never valid.

**Why:** A completed session without a category cannot be classified for reporting or analytics. The business requires every work period to be categorized.

**Applies to:** Session completion.

---

## Invariant 7: Notifications Belong to One Student

**Statement:** A Notification is associated with exactly one Student and this relationship cannot change.

**Why:** Notifications are personal communications about a specific student's sessions.

**Applies to:** Notification ownership.

---

## Invariant 8: Activity Log Entries Are Immutable

**Statement:** Once written, an ActivityLog entry cannot be modified, deleted, or reordered.

**Why:** The activity log exists for audit purposes. Modifiability defeats its purpose.

**Applies to:** All ActivityLog entries.

---

## Invariant 9: Category Names Are Unique Among Active Categories

**Statement:** No two Active Categories can have the same name.

**Why:** Duplicate category names cause ambiguity in reporting.

**Applies to:** Category creation and renaming.

---

## Invariant 10: Student Identifiers Are Unique

**Statement:** Each Student must have a unique identifier.

**Why:** The identifier is the primary way to look up a student for scanning. Duplicates would cause ambiguity.

**Applies to:** Student creation.

---

## Invariant 11: Faculty Cannot Be Students

**Statement:** An individual cannot act as both Faculty and Student within the same workspace system.

**Why:** Role separation ensures that no individual can record their own attendance. The scanner and the scanned must be different people.

**Applies to:** Account creation.

---

## Invariant 12: Summary Cannot Be Submitted Without Exit

**Statement:** A work summary can only be submitted for a session that has had exit recorded (session is in Awaiting Summary status).

**Why:** The summary describes work done during the session. Until the session ends, the work period is not complete.

**Applies to:** Work summary submission.
