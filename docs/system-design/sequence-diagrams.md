# Sequence Diagrams

All diagrams use text-based notation to describe interactions between actors and system modules.

---

## SD1: Normal Entry → Category → Exit → Summary

```
Student        Faculty        Session Mgmt    Category Mgmt    Notification    Activity Log
   │              │                │               │                │               │
   │   present ID │                │               │                │               │
   │─────────────►│                │               │                │               │
   │              │  scan entry    │               │                │               │
   │              │───────────────►│               │                │               │
   │              │                │ verify student│               │               │
   │              │                │ check session │               │               │
   │              │                │ create session│               │               │
   │              │                │ record entry  │               │               │
   │              │                │               │                │               │
   │              │                │ request notify│               │               │
   │              │                │──────────────►│               │               │
   │              │                │               │   create notif │               │
   │              │                │               │───────────────►│               │
   │              │                │  log action   │               │               │
   │              │                │─────────────────────────────────►               │
   │              │   confirmed    │               │                │               │
   │              │◄───────────────│               │                │               │
   │   notified   │                │               │                │               │
   │◄─────────────│                │               │                │               │
   │              │                │               │                │               │
   │  select cat  │                │               │                │               │
   │───────────────│──────────────►│               │                │               │
   │              │                │ verify cat    │               │                │
   │              │                │──────────────►│                │               │
   │              │                │  cat valid    │                │               │
   │              │                │◄──────────────│                │               │
   │              │                │ transition to │               │                │
   │              │                │ Active        │                │               │
   │              │                │  log action   │                │               │
   │              │                │────────────────────────────────►               │
   │   confirmed  │                │                │               │               │
   │◄─────────────│────────────────│                │               │               │
   │              │                │                │               │               │
   │   present ID │                │                │               │               │
   │─────────────►│                │                │               │               │
   │              │  scan exit     │                │               │               │
   │              │───────────────►│                │               │               │
   │              │                │ find session   │               │               │
   │              │                │ record exit    │               │               │
   │              │                │ transition to  │               │               │
   │              │                │ AwaitSummary   │               │               │
   │              │                │                │               │               │
   │              │                │ request notify │               │               │
   │              │                │───────────────►│               │               │
   │              │                │                │  create notif │               │
   │              │                │                │──────────────►│               │
   │              │                │  log action    │               │               │
   │              │                │─────────────────────────────────►               │
   │              │   confirmed    │                │               │               │
   │              │◄───────────────│                │               │               │
   │   notified   │                │                │               │               │
   │◄─────────────│                │                │               │               │
   │              │                │                │               │               │
   │  submit sum  │                │                │               │               │
   │───────────────│────────────────               │               │               │
   │              │                │ verify summary │               │               │
   │              │                │ transition to  │               │               │
   │              │                │ Completed      │               │               │
   │              │                │ reason=NORMAL  │               │               │
   │              │                │  log action    │               │               │
   │              │                │────────────────────────────────►               │
   │   confirmed  │                │                │               │               │
   │◄─────────────│────────────────│                │               │               │
```

---

## SD2: Manual Exit by Faculty

```
Student        Faculty        Session Mgmt    Notification    Activity Log
   │              │                │               │               │
   │              │  initiate      │               │               │
   │              │  manual exit   │               │               │
   │              │───────────────►│               │               │
   │              │                │               │               │
   │              │  provide reason│               │               │
   │              │───────────────►│               │               │
   │              │                │               │               │
   │              │                │ find session  │               │
   │              │                │ assign cat    │               │
   │              │                │ (if missing)  │               │
   │              │                │ record exit   │               │
   │              │                │ transition to │               │
   │              │                │ Completed     │               │
   │              │                │ reason=MANUAL │               │
   │              │                │               │               │
   │              │                │ request notify│               │
   │              │                │──────────────►│               │
   │              │                │               │ create notif  │
   │              │                │  log action   │               │
   │              │                │ with reason   │               │
   │              │                │──────────────────────────────►│
   │              │  confirmed     │               │               │
   │              │◄───────────────│               │               │
   │   notified   │                │               │               │
   │◄─────────────│────────────────│───────────────│               │
```

---

## SD3: Auto-Completion After Grace Period

```
System Clock    Session Mgmt    Activity Log
   │                │               │
   │  tick          │               │
   │───────────────►│               │
   │                │               │
   │                │ check sessions│
   │                │ in Awaiting   │
   │                │ Summary       │
   │                │               │
   │                │ for each:     │
   │                │ compare exit  │
   │                │ time + grace  │
   │                │ to now        │
   │                │               │
   │                │ if expired:   │
   │                │ verify cat    │
   │                │ assigned      │
   │                │               │
   │                │ if cat OK:    │
   │                │ transition to │
   │                │ Completed     │
   │                │ reason=AUTO   │
   │                │               │
   │                │  log action   │
   │                │──────────────►│
   │                │               │
   │                │ if cat miss:  │
   │                │ flag for      │
   │                │ admin review  │
   │                │               │
```

---

## SD4: Session Override by Admin

```
Admin           Session Mgmt    Category Mgmt   Activity Log
  │                   │               │               │
  │  review session   │               │               │
  │──────────────────►│               │               │
  │                   │               │               │
  │  provide details  │               │               │
  │  and reason       │               │               │
  │──────────────────►│               │               │
  │                   │               │               │
  │                   │ verify admin  │               │
  │                   │ authorization │               │
  │                   │               │               │
  │                   │ if cat needed:│               │
  │                   │──────────────►│               │
  │                   │ cat confirmed │               │
  │                   │◄──────────────│               │
  │                   │               │               │
  │                   │ apply override│               │
  │                   │ transition to │               │
  │                   │ Completed     │               │
  │                   │ reason=ADMIN  │               │
  │                   │               │               │
  │                   │ log override  │               │
  │                   │ with reason   │               │
  │                   │──────────────────────────────►│
  │                   │               │               │
  │  confirmed        │               │               │
  │◄──────────────────│               │               │
```

---

## SD5: Duplicate Entry Attempt (Rejected)

```
Faculty         Session Mgmt    Activity Log
   │                 │               │
   │  scan entry     │               │
   │  (student X)    │               │
   │────────────────►│               │
   │                 │               │
   │                 │ find session  │
   │                 │ for student X │
   │                 │               │
   │                 │ incomplete    │
   │                 │ session found │
   │                 │ (Active)      │
   │                 │               │
   │                 │ reject entry  │
   │                 │ rule: Rule 1  │
   │                 │               │
   │                 │ log rejection │
   │                 │ (no change)   │
   │                 │──────────────►│
   │                 │               │
   │  rejected:      │               │
   │  "already       │               │
   │  inside"        │               │
   │◄────────────────│               │
```

---

## SD6: Concurrent Entry Attempts (Race Condition)

```
Faculty A       Faculty B      Session Mgmt
   │                 │               │
   │  scan entry     │               │
   │  (student X)    │               │
   │────────────────►│               │
   │                 │               │
   │                 │  scan entry   │
   │                 │  (student X)  │
   │                 │──────────────►│
   │                 │               │
   │                 │               │  check existing
   │                 │               │  session for X
   │                 │               │  → none found
   │                 │               │
   │                 │               │  check existing
   │                 │               │  session for X
   │                 │               │  → none found
   │                 │               │
   │                 │               │  create session
   │                 │               │  for X (A wins)
   │                 │               │
   │                 │               │  create session
   │                 │               │  for X (B fails)
   │                 │               │  → duplicate
   │                 │               │
   │  confirmed      │               │
   │◄────────────────┤               │
   │                 │  rejected     │
   │                 │◄──────────────│
```

Note: The system must ensure that concurrent entry attempts result in exactly one session created. The second attempt is rejected.
