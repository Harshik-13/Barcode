# Operational Scenarios

## S1: Normal Working Day

**Context:** A typical day at the workspace. Multiple students arrive, work, and leave.

**Time:** 09:00 — 18:00

**Participants:** 30 students, 2 Faculty members, 1 Admin (remote)

**Flow:**
1. 09:00 — Faculty A arrives, authenticates, and positions at entrance.
2. 09:05–10:00 — Students arrive in waves. Faculty A scans each student's identification. Each scan creates a session in Created status.
3. 09:10–10:30 — Students select work categories (Coding, Design, Research). Sessions transition to Active.
4. 12:00 — Faculty B arrives for shift change. Faculty A briefs Faculty B.
5. 12:00–17:00 — Students work. Some take breaks (remain inside workspace).
6. 13:00 — Faculty A leaves. Faculty B continues.
7. 15:00 — Student X finishes work. Faculty B scans exit. Session moves to Awaiting Summary.
8. 15:05 — Student X submits work summary. Session becomes Completed (NORMAL).
9. 15:00–17:30 — More students exit. Faculty B scans each exit.
10. 17:00 — Most students have exited and submitted summaries.
11. 17:30 — Last student exits.
12. 18:00 — Faculty B checks occupancy to confirm workspace is empty. Ends shift.

**Outcome:** All sessions completed normally. Attendance records accurate.

---

## S2: Peak-Hour Entry

**Context:** Many students arrive simultaneously (e.g., morning rush).

**Time:** 09:00 — 09:15

**Participants:** 15 students, 1 Faculty member

**Flow:**
1. 09:00 — Large group arrives at entrance.
2. Faculty scans each student in sequence.
3. Students wait briefly for their turn.
4. System processes each scan individually.
5. All 15 sessions created successfully.
6. Faculty confirms no students waiting.

**Potential issues:**
- Faculty may accidentally double-scan a student (handled by duplicate detection).
- Students may crowd the entrance. Faculty manages the queue.

**Outcome:** All entries recorded. No sessions lost.

---

## S3: Faculty Shift Change

**Context:** Morning Faculty leaves, afternoon Faculty arrives.

**Participants:** Faculty A (morning), Faculty B (afternoon), students

**Flow:**
1. Faculty A recorded all entries in the morning.
2. 12:00 — Faculty B arrives. Faculty A transfers any relevant information.
3. 13:00 — Faculty A logs out. Faculty B continues scanning.
4. Faculty B records exits for students who leave in the afternoon.
5. System records separate entry recorder (Faculty A) and exit recorder (Faculty B) for each session.

**Outcome:** Sessions have correct entry and exit recorders. Audit trail is complete.

---

## S4: Power Outage

**Context:** Workspace experiences a power outage during operation.

**Time:** 14:30

**Duration:** 45 minutes

**Participants:** 10 students (inside), 1 Faculty member

**Flow:**
1. 14:30 — Power fails. Scanning devices lose power.
2. Faculty cannot scan for the duration.
3. Some students may leave without being scanned out.
4. 15:15 — Power restored.
5. Faculty re-authenticates and checks session statuses.
6. Faculty identifies students who left during the outage (by visual recall or occupancy check).
7. Faculty performs Manual Exit for each affected student with reason "power outage."
8. Students who remained inside continue their sessions normally.

**Outcome:** All sessions correctly ended. Manual exit records document the exceptional circumstances.

---

## S5: Network Outage

**Context:** Internet connectivity is lost while Faculty is scanning.

**Participants:** 1 Faculty member, students

**Flow:**
1. Faculty scans student entry — request fails (no connectivity).
2. Faculty continues scanning offline. Each scan is cached locally.
3. Faculty records 8 entries over 30 minutes of offline operation.
4. Connectivity is restored.
5. Faculty's device syncs cached scans to server.
6. All 8 sessions are created.
7. Faculty receives confirmation of successful sync.

**Potential issues:**
- Sync conflict: If another Faculty member online also scanned one of these students, the sync may reject one entry. Faculty is notified.
- Duplicate prevention: Faculty should verify no duplicate sessions were created.

**Outcome:** Sessions created correctly. Any conflicts flagged for review.

---

## S6: Student Forgets Summary

**Context:** Student exits but does not submit a work summary.

**Participants:** 1 Student, 1 Faculty, System

**Flow:**
1. Faculty scans Student X exit. Session moves to Awaiting Summary.
2. System sends exit notification with reminder to submit summary.
3. Student X does not submit summary.
4. 30 minutes after exit: System sends summary reminder notification.
5. Student X still does not submit.
6. Grace period (e.g., 24 hours) expires.
7. System auto-completes the session with Completion Reason AUTO_COMPLETED.
8. System sends auto-completion notice to Student X.

**Outcome:** Session completed. Attendance is valid. No summary on record.

---

## S7: Faculty Performs Manual Exit

**Context:** Student leaves the workspace without being scanned.

**Participants:** 1 Student, 1 Faculty, System

**Flow:**
1. Student exits during a busy period without Faculty noticing.
2. Faculty later checks occupancy and notices Student is missing but session is still Active.
3. Faculty attempts to locate Student — not found.
4. Faculty initiates Manual Exit.
5. Faculty selects the student and provides reason: "student left without scanning."
6. Faculty provides approximate exit time (e.g., 15:30 instead of current 16:00).
7. System records manual exit with reason.
8. If no category selected, Faculty assigns one based on known student activity.
9. Session completes with Completion Reason MANUAL_EXIT.
10. Activity Log records the manual exit with Faculty identity and reason.

**Outcome:** Session completed accurately. Audit trail documents the exceptional procedure.

---

## S8: Administrator Investigates Attendance

**Context:** A student disputes their attendance record.

**Participants:** 1 Admin, 1 Student, System

**Flow:**
1. Student contacts Admin claiming their attendance is not recorded for a specific date.
2. Admin reviews the student's session history.
3. Admin checks Activity Log for relevant entries.
4. Admin finds:
   - No entry scan recorded for the claimed date.
   - No exit recorded.
   - No Faculty reported manual exit for that student.
5. Admin determines the student was not scanned in.
6. Admin explains that attendance cannot be retroactively created without a Faculty-recorded entry.
7. If the student was genuinely present but not scanned, Admin notes the gap for process improvement.

**Alternative:**
- If the session exists but is incomplete, Admin may perform an override to correct it.

**Outcome:** Attendance record is verified. Any corrections are made with documented justification.

---

## S9: Student Returns After Exiting

**Context:** A student leaves, then returns to the workspace later the same day.

**Participants:** 1 Student, 1 Faculty, System

**Flow:**
1. Student X enters in the morning. Session created (Active).
2. Student X exits at lunch. Session moves to Awaiting Summary.
3. Student X does not submit summary yet.
4. Student X returns after lunch.
5. Faculty scans Student X for entry.
6. System checks: Student X has a session in Awaiting Summary (incomplete).
7. Entry is rejected: Student already has an incomplete session.
8. Faculty informs Student X that the previous session must be completed first.
9. Student X submits summary from the morning session (or it auto-completes).
10. Once the morning session is Completed, Faculty scans entry again.
11. New session is created for the afternoon.

**Outcome:** Only one incomplete session per student is enforced. Student completes the first session before starting the second.

---

## S10: Category Selection Delay

**Context:** A student enters but does not select a category for an extended period.

**Participants:** 1 Student, System

**Flow:**
1. 09:00 — Student enters. Session Created.
2. 09:15 — System sends category reminder (first threshold).
3. 09:30 — Student still has not selected. Second reminder sent.
4. 10:00 — Student selects "Coding." Session becomes Active.
5. Student works until 13:00 and exits normally.

**Alternative (student never selects):**
1. 09:00 — Student enters. Session Created.
2. Reminders continue at configured intervals.
3. 13:00 — Student exits without selecting a category.
4. Faculty records exit. Session moves to Awaiting Summary (still no category).
5. Student cannot complete session without a category.
6. Faculty performs Manual Exit with category assignment, or Admin overrides.

**Outcome:** Category is mandatory for completion. Either the student selects it, or Faculty/Admin intervenes.

---

## S11: Multiple Faculty, Same Student

**Context:** Two different Faculty members interact with the same student on the same day.

**Participants:** 1 Student, Faculty A (entry), Faculty B (exit)

**Flow:**
1. Faculty A scans Student X entry in the morning. Session Created.
2. Student X works through the day.
3. Faculty B (afternoon shift) scans Student X exit.
4. Session records: entry recorder = Faculty A, exit recorder = Faculty B.
5. Audit trail shows both identities.

**Outcome:** Each session correctly records both the entry and exit Faculty members.

---

## S12: Admin Investigates Anomalous Session

**Context:** A session has an unusually long duration (e.g., 16 hours).

**Participants:** 1 Admin, System

**Flow:**
1. Admin reviews daily report.
2. A session shows 16-hour duration.
3. Admin investigates:
   - Entry time: 08:00 (recorded by Faculty A)
   - Exit time: 00:00 next day (recorded by Faculty B)
4. Admin checks Activity Log for any manual exit or override.
5. Admin checks if the student was flagged for review.
6. Admin determines the student likely forgot to scan out.
7. Admin performs override to correct the exit time to a reasonable estimate, documenting the reason.

**Outcome:** Anomalous session corrected. Admin documents the reason in the override.
