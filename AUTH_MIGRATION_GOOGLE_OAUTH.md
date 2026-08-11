# Auth Migration: Google OAuth

> **Status: BLUEPRINT — Phases 1, 2, 3 IMPLEMENTED as of 2026-08-11.**
>
> **Phases 4–7 pending** (student onboarding redesign, faculty/admin binding, legacy removal, regression testing).
>
> This document is the **single source of truth** for replacing the OTP/password authentication system with Google OAuth.
> Future implementation prompts MUST reference this document and follow it exactly.

---

## 1. Purpose

Replace the entire OTP/password-based authentication system of the 8Hour Workspace Barcode Attendance System with Google OAuth.

- **Authentication changes.** Nothing else.
- **Authorization does NOT change.**
- **Attendance does NOT change.**
- **Notifications do NOT change.**
- **Scanning does NOT change.**
- **Session lifecycle does NOT change.**
- **Profile module remains.**
- **Push notifications remain.**
- **Role system remains.**

The current system is stable and production-ready (backend 160/160 tests passing, frontend working). The migration MUST preserve all existing functionality unless a feature is explicitly replaced by this document.

---

## 2. Current Authentication Architecture (as of this document)

The system today authenticates with email + password, provisioned through OTP activation flows.

### 2.1 Actors and statuses

| Entity | Table | Statuses |
|---|---|---|
| User (all roles) | `users` | `invited`, `active`, `suspended`, `deactivated` |
| Student | `students` | `invited`, `enrolled`, `suspended`, `departed` |

### 2.2 `users` table (current columns)

| Column | Purpose |
|---|---|
| `id` | PK |
| `email` | Unique, login identifier. Student emails are derived from roll number (`<roll>@vnrvjiet.in`). |
| `name` | Display name |
| `password_hash` | bcrypt hash (12 rounds), set during activation |
| `role_id` | FK to `roles(id)` — `admin` / `faculty` / `student` |
| `status` | Account lifecycle |
| `created_at` | Timestamp |
| `profile_picture` | Uploaded avatar (kept) |
| `password_changed_at` | Used to invalidate JWTs after a password change |

### 2.3 `students` table (current columns)

| Column | Purpose |
|---|---|
| `id` | PK |
| `roll` | Unique; also serves as the barcode scanned at entry/exit |
| `name` | Display name |
| `email` | Derived `<roll>@vnrvjiet.in`, set by activation or import |
| `branch` / `section` | Academic info (editable in profile) |
| `status` | Lifecycle |
| `created_at` | Timestamp |
| `hostel` | Optional field |
| `source` | `manual` or `excel_import` — tracks how the student was enrolled |

### 2.4 Current flows

#### Student OTP activation (`backend/src/services/activation.ts`, `routes/activation.ts`)
1. Student enters roll number on `ActivatePage`.
2. Server looks up the student by roll (must already exist — see Excel import), derives `roll@vnrvjiet.in`, stores a bcrypt-hashed 6-digit OTP in `activation_otps` (expiry 10 min, 5 max attempts, 30 s resend cooldown), emails it via SMTP.
3. Student verifies OTP → server issues a one-time `activation_token`.
4. Student sets a password (validated by `passwordValidation.ts`: min 8 chars, upper, lower, digit, special).
5. Server creates the `users` row (`role_id = 'student'`, `status = 'active'`), marks student `enrolled`.

#### Faculty OTP activation (`backend/src/services/facultyActivation.ts`, `routes/facultyActivation.ts`)
- Admin creates a faculty member via `/faculty` (status `invited`, role `faculty`).
- Faculty activates with the same OTP → set-password flow against `faculty_activation_otps`.
- Admins are seeded directly in the database (no activation flow).

#### Password login (`backend/src/services/auth.ts`, `routes/auth.ts`)
- `POST /auth/login` — bcrypt compare of email + password, rejects inactive accounts, issues a JWT.
- JWT payload: `{ sub: userId, type: role, pca: passwordChangedAtEpoch, iat, exp }`, HS256 with `JWT_SECRET`, expiry `JWT_EXPIRY_HOURS` (default 12 h).
- `requireAuth` middleware verifies the JWT and cross-checks `pca` against `users.password_changed_at` so password changes revoke live sessions.

#### Forgot / reset password (`backend/src/services/passwordReset.ts`, `routes/auth.ts`)
- `POST /auth/forgot-password` → emails a reset link (token hashed in `password_reset_tokens`, expires 15 min).
- `POST /auth/reset-password` → validates token, sets new password, bumps `password_changed_at`.

#### Change password (`backend/src/services/password.ts`, `routes/profile.ts`)
- `PATCH /profile/change-password` — verifies current password, writes new bcrypt hash, bumps `password_changed_at`.

#### Excel student import (`backend/src/services/studentImport.ts`, `routes/studentImport.ts`, `frontend StudentsPage`)
- Admin uploads an `.xlsx` roster; `SHEET_BRANCH_MAP` + sheet-name parsing assigns branch/section.
- Inserts/updates `students` with `email = roll + domain`, `status = 'invited'`, `source = 'excel_import'`.
- Imported students then go through OTP activation.

#### Email/SMTP (`backend/src/services/email.ts`)
- Nodemailer (Gmail SMTP) used ONLY for OTP emails and password-reset emails. `verifySmtp()` is required in production.

#### Frontend auth surface
- `Login.tsx` (email + password), `ForgotPassword.tsx`, `ResetPassword.tsx`, `ActivatePage.tsx`, `FacultyActivatePage.tsx`, `store/AuthContext.tsx`, `services/apiService.ts` (`authApi`, `activationApi`, `facultyActivationApi`), `services/api.ts` (token storage key `workspace_token`).

#### Audit trail (kept)
- `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `ACTIVATION_OTP_SENT`, `ACTIVATION_OTP_FAILED`, `ACTIVATION_OTP_VERIFIED`, `ACTIVATION_COMPLETED`, `ACTIVATION_OTP_RESENT`, `PASSWORD_CHANGED`, `PERMISSION_DENIED`.

### 2.5 Why this architecture is being replaced

1. **Password + OTP burden on students.** Students must remember a password they set once, or recover it through OTP email every time. OTPs depend on SMTP delivery which is slow, flaky, and adds a hard infrastructure dependency (production refuses to boot without SMTP credentials).
2. **Onboarding friction.** A new student can only join after an admin imports their roll via Excel, then completes a 3-step OTP dance. There is no self-service entry.
3. **No identity guarantee.** Password login only proves knowledge of a credential; OTP proves mailbox access, but the mailbox is self-registered in the current flow. Google Sign-In proves identity against the official `@vnrvjiet.in` account.
4. **Credential management surface.** Password hashing, reset tokens, change-password, PCA token revocation, and OTP tables are a large attack and maintenance surface for a product that does not need passwords.
5. **Account lifecycle duplication.** `users.status`, `students.status`, and activation state are maintained in parallel and can drift.
6. **Deliverable:** Google OAuth gives verified identity, instant provisioning, and removes the entire password/OTP subsystem.

---

## 3. New Authentication Architecture (Google OAuth)

### 3.1 High-level flow

```
Continue with Google
        │
        ▼
Google Authentication (Google sign-in page)
        │
        ▼
Browser sends Google ID Token to backend
        │
        ▼
Server verifies Google ID Token
        ├─ issuer  (https://accounts.google.com / https://accounts.google.com)
        ├─ audience (client ID)
        ├─ expiry  (exp)
        ├─ email_verified === true
        └─ email ends with @vnrvjiet.in  (accept ONLY this domain)
        │
        ▼
Determine role
        ├─ student → auto-provision on first login
        ├─ faculty → must already exist as a user
        └─ admin   → must already exist as a user
        │
        ▼
Issue existing application JWT
        │
        ▼
Application (dashboard, scanner, everything else unchanged)
```

### 3.2 Identity model

- **Google is the identity provider (IdP).** Google is never used for authorization and never issues the session token.
- **The application JWT remains the session mechanism.** The existing `JWT_SECRET` HS256 JWT with `sub`/`type`/`iat`/`exp` payload, issued by the backend, is used for every authenticated request — exactly as today. Nothing downstream of login changes.
- **`google_sub` is the permanent identity binding.** After first login, the user's `google_sub` is stored and used for all subsequent lookups.

### 3.3 OAuth flow details

1. Frontend renders a "Continue with Google" button (Google Identity Services `google.accounts.id` or sign-in-with-Google redirect, chosen in Phase 2).
2. Google returns an ID token (JWT signed by Google, containing `sub`, `email`, `email_verified`, `name`, `picture`, `iss`, `aud`, `exp`, `iat`, `hd`).
3. Frontend sends the raw ID token to a new backend endpoint (proposed: `POST /api/auth/google`). The client is NEVER trusted to supply profile data; the token is the only input.
4. Backend verifies the token against Google's public keys (issuer, audience = own OAuth client ID, `exp` not passed, `email_verified === true`, email domain `@vnrvjiet.in`). `hd` (hosted domain) is an additional Google-side signal and must match the allowlisted domain.
5. Backend resolves the role and provisions/links the account (sections 4–6).
6. Backend issues the existing application JWT and returns the same login response shape used today (`{ token, user: { id, name, role, email, studentId } }`), so `AuthContext` and the whole frontend session flow are untouched.

### 3.4 Domain gate

- Only accounts with verified email ending in **`@vnrvjiet.in`** are accepted. All other accounts are rejected with a clear error, regardless of Google account validity.
- The domain list lives in server config (replacing/extending `config.activation.studentEmailDomain` semantics with an allowlist) and is enforced server-side only.

---

## 4. Student Flow

Students NO LONGER require OTP, passwords, activation, Excel import, or manual enrollment.

```
Student clicks "Continue with Google"
        │
        ▼
Google returns verified email, name, Google User ID (sub), picture
        │
        ▼
Server extracts roll number from the official email
  (local part of <roll>@vnrvjiet.in)
        │
        ▼
If student does NOT exist (no students row with this roll):
        ├─ Automatically create the Student record
        │     roll (from email), name (from Google), email, status 'enrolled'
        ├─ Automatically create the User record
        │     email, name, role_id 'student', status 'active', google_sub
        │
        ▼
Prompt student (ONLY) for:
        ├─ Branch   (required)
        ├─ Section  (required)
        └─ Hostel   (optional)
        │
        ▼
Student enters the application (JWT issued)
```

Rules:

- The **first login** auto-provisions the account. If the student already exists (matched by roll from email, or by existing `students.email`), the existing record is linked — never duplicated.
- On provisioning, the student row is created `enrolled` and the user row `active` immediately — there is no intermediate `invited` state anymore.
- The one-time onboarding screen collects **only** Branch, Section, Hostel (optional). Name and email come from Google and are stored from the verified token, never from user input.
- **Subsequent logins** match purely by `google_sub` — no prompts, no onboarding, straight into the student dashboard.
- `profile_picture` is seeded from the Google `picture` claim on first login (existing profile picture upload/delete continues to work afterwards).
- The roll number extracted from the email IS the barcode used by the scanner. It must be stored uppercase-normalized and unique, exactly as today.

---

## 5. Faculty Flow

Faculty MUST NOT auto-register.

```
Google Login
        │
        ▼
Verified official @vnrvjiet.in email
        │
        ▼
Look up existing faculty user by email
        ├─ Found  → store google_sub (if not already bound), issue JWT → Faculty Dashboard
        └─ Not found → REJECT login (no account created, no role granted)
```

Rules:

- Faculty accounts are still created by an admin through `POST /faculty` (the Faculty Management page stays; only its activation status semantics change).
- On first successful Google login, the faculty user's `google_sub` is bound and the account status becomes/remains `active`.
- A `@vnrvjiet.in` Google account that is not a known faculty user is rejected.

---

## 6. Admin Flow

Identical to faculty, with a stricter rule:

- Admins MUST already exist as users with `role_id = 'admin'`.
- **Never auto-create admins** under any circumstance.
- On first Google login, bind `google_sub`; issue JWT; route to Admin Dashboard.

---

## 7. Database Migration

### 7.1 `users` table

| Column | Action |
|---|---|
| `id` | **Keep** |
| `email` | **Keep** (unique; still the canonical email) |
| `name` | **Keep** |
| `role_id` | **Keep** (authorization unchanged) |
| `status` | **Keep** (lifecycle unchanged; `invited` becomes unused for students) |
| `created_at` | **Keep** |
| `profile_picture` | **Keep** |
| `google_sub` | **ADD** — `TEXT UNIQUE` (null for legacy password users until their first Google login) |
| `password_hash` | **REMOVE** |
| `password_changed_at` | **REMOVE** (JWT PCA revocation no longer applies) |

### 7.2 `students` table

| Column | Action |
|---|---|
| `id` | **Keep** |
| `roll` | **Keep** (unique; scanner barcode) |
| `name` | **Keep** (seeded from Google on self-provision) |
| `email` | **Keep** |
| `branch` / `section` | **Keep** (onboarding prompt + profile edit) |
| `hostel` | **Keep** (optional onboarding field) |
| `status` | **Keep** (now `enrolled` from creation; `invited` becomes unused) |
| `created_at` | **Keep** |
| `source` | **REMOVE** (no more `manual` / `excel_import` tracking) |

### 7.3 Tables to drop

| Table | Reason |
|---|---|
| `activation_otps` | OTP system removed entirely |
| `faculty_activation_otps` | OTP system removed entirely |
| `password_reset_tokens` | Password reset removed entirely |

### 7.4 Migration mechanics

- One idempotent schema migration (extend the existing `backend/src/db/migrate.ts` style).
- `ALTER TABLE ... ADD COLUMN google_sub` (idempotent), unique index created only if not present.
- Column drops are data-loss operations; take a pre-migration dump. Any user still relying on a password must first sign in with Google (email-lookup fallback, section 9) before password login is switched off — see Phase 6 rollout order.
- Existing `students.email` values and roll derivations must remain consistent: `roll = emailLocalPart` is the join key for legacy student rows.

---

## 8. Remove Entirely

Every subsystem below is deleted, with the reason.

| # | Subsystem | Files (current) | Why it can be removed |
|---|---|---|---|
| 1 | OTP generation | `services/activation.ts`, `services/facultyActivation.ts` (Otp parts) | Google ID token replaces mailbox proof; no shared secret to deliver |
| 2 | OTP verification | same files | Replaced by server-side Google token verification |
| 3 | OTP resend / cooldown | same files | No OTPs exist to resend |
| 4 | Student activation routes | `routes/activation.ts` (`/activation/start`, `/verify-otp`, `/set-password`, `/resend-otp`, `/status`) | Self-service provisioning replaces the whole flow |
| 5 | Faculty activation routes | `routes/facultyActivation.ts` | Faculty sign in with Google directly; admin still manages the roster |
| 6 | Activation tables | `activation_otps`, `faculty_activation_otps` | No state to persist |
| 7 | Password hashing | `services/auth.ts` (bcrypt), `services/password.ts`, `passwordValidation.ts` | No passwords are stored |
| 8 | Password login | `POST /auth/login` (email+password path) | Replaced by `POST /auth/google` |
| 9 | Forgot password | `services/passwordReset.ts`, `POST /auth/forgot-password` | Google password recovery handles this; app has no password |
| 10 | Change password | `services/password.ts`, `PATCH /profile/change-password` | No password exists to change |
| 11 | Password reset tokens | `password_reset_tokens` table | Removed with the reset flow |
| 12 | Excel student import | `services/studentImport.ts`, `routes/studentImport.ts`, `students` `source` column, import UI in `StudentsPage.tsx`, import audit | Students self-register; no roster upload needed |
| 13 | Activation emails | `services/email.ts` (`sendOtpEmail`, `sendPasswordResetEmail`) | No OTP/reset emails are sent |
| 14 | SMTP dependency (for OTP) | `config` email block, `verifySmtp()` boot requirement | No transactional email remains; SMTP can be dropped from prod startup requirements (keep optional config if future emails are needed, but it must NOT gate startup) |
| 15 | Frontend activation pages | `ActivatePage.tsx`, `FacultyActivatePage.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx` | Replaced by Google sign-in on `Login.tsx` |
| 16 | Frontend activation clients | `apiService.ts` `activationApi`, `facultyActivationApi`, password endpoints in `authApi` | Backend routes gone |
| 17 | Audit actions tied to removed flows | `ACTIVATION_*`, `PASSWORD_CHANGED` | Logged events no longer occur; add `GOOGLE_LOGIN`, `GOOGLE_LOGIN_FAILED`, `GOOGLE_LOGIN_REJECTED_DOMAIN` |

**Nothing outside this list changes.** Deletion is done only after the new flow is verified live (Phase 6), never before.

---

## 9. Keep Unchanged

The following MUST remain functionally identical:

- **JWT** — same secret, same payload shape, same expiry semantics (minus PCA), same HS256 signing (`services/auth.ts` `signToken`).
- **Authorization middleware** — `requireAuth`, `requireRole`, `requireOwnership`, `requireOwnStudentResource` in `middleware/auth.ts`.
- **Role system** — `roles` table, role-based routing, per-role UI.
- **Attendance / session lifecycle** — `services/session.ts` state machine (`created → active → awaiting_summary → completed/archived`), double-entry prevention, transitions.
- **Scanner** — `/scan` route, barcode lookup by roll, rate limiting, offline queue, camera scanner.
- **Notifications** — student + faculty notifications, broadcast.
- **Push notifications** — VAPID subscription/dispatch subsystem.
- **Profile module** — profile fetch/update, branch/section/hostel editing, profile picture upload/remove/serve.
- **Faculty dashboard, Student dashboard, Admin dashboard** — unchanged (login response shape stays identical).
- **Analytics** — session stats, dashboard stats endpoints.
- **Audit logging** — `activity_logs` table and `logAudit` (new auth actions only add new action names).
- **PDF export** — not present in the current codebase; if introduced later it must remain independent of authentication. Nothing in this migration touches it.
- **Session management** — the app JWT is still the only session artifact; logout still calls `POST /auth/logout` for audit.
- **`students` statuses** `suspended`/`departed` — a Google login attempt for a suspended/deactivated account must be rejected exactly as password login rejects inactive accounts today.

---

## 10. Security Requirements

1. **Server-side verification only.** The backend verifies the Google ID token itself (cryptographic verification via Google's JWKS public keys). The client never sends "profile data"; it sends the token. Trust nothing else.
2. **Never trust client profile data.** Name, email, picture, and domain come exclusively from the verified token claims.
3. **Validate the token:**
   - `iss` — must be Google's issuer (`https://accounts.google.com`).
   - `aud` — must equal this application's OAuth client ID.
   - `exp`/`iat` — reject expired/not-yet-valid tokens.
   - `email_verified === true` — reject unverified accounts.
4. **Domain allowlist.** Reject every account whose verified email is not `@vnrvjiet.in` (`hd` must also match when present). Log the rejection (`GOOGLE_LOGIN_REJECTED_DOMAIN`).
5. **Identity matching:**
   - Primary match: `users.google_sub = token.sub` (unique constraint).
   - First-login fallback: match by email only when `google_sub` is null — then **permanently bind** `google_sub`. After binding, email lookup is never used again for that user.
   - A `google_sub` already bound to another account is an identity conflict → reject.
6. **Account takeover prevention.** Because `google_sub` is unique and binding is one-way, a Google account cannot claim a user whose `sub` is already bound. Email fallback is only honored once, and only from a verified `@vnrvjiet.in` token.
7. **Privilege escalation prevention.** Role is never taken from Google. Role is determined by the existing `users.role_id` (faculty/admin) or assigned as `student` during student auto-provision. No endpoint accepts a role from a client during login or onboarding.
8. **No unauthorized role assignment.** Admin/faculty never auto-create; the domain gate plus roster lookup ensures only known faculty/admins gain those roles. Students always get `student` — nothing they send can change it.
9. **Suspended/deactivated accounts** are rejected at login regardless of Google validity.
10. **Rate limiting** — the new Google login endpoint inherits the same `authLimiter` protection as `/auth/login` today.
11. **Audit** — every Google login attempt (success, failure, domain rejection, conflict) is audited with the same `activity_logs` pattern.

---

## 11. Migration Strategy (Phased)

### Phase 1 — Preparation
- **Objective:** Understand and freeze the current auth surface; make the plan executable.
- **Files affected:** none (documentation only) — this document; inventory of auth routes/services/tests.
- **Risks:** Scope creep into non-auth subsystems. Mitigation: the "Keep Unchanged" section is normative.
- **Rollback:** none needed (no code).

### Phase 2 — Google OAuth integration
- **Objective:** Register OAuth client, add token verification, add `POST /auth/google`, verify tokens, issue existing JWT; frontend "Continue with Google" button on `Login.tsx`; return the exact current login response shape.
- **Files affected (backend):** `config`, `.env` (new `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`/JWKS verification, `ALLOWED_EMAIL_DOMAINS`), new `services/googleAuth.ts`, `services/auth.ts` (`signToken` reuse), `routes/auth.ts` (new endpoint), `middleware/rateLimiter.ts` (reuse `authLimiter`).
- **Files affected (frontend):** `pages/Login.tsx`, `services/apiService.ts` (`authApi.googleLogin`), `.env` (`VITE_GOOGLE_CLIENT_ID`), `store/AuthContext.tsx` (only the login call — session handling untouched).
- **Risks:** Token verification bugs (wrong aud/iss), Google library version issues, login response drift breaking dashboards.
- **Rollback:** Remove the Google route/button; `/auth/login` with passwords still active. **Both login paths work during Phase 2.**

### Phase 3 — Database migration
- **Objective:** Add `users.google_sub` (unique, nullable); keep all legacy columns; pre-migration dump; backfill is a no-op at this point.
- **Files affected:** `db/migrate.ts`, migration tests.
- **Risks:** Unique index creation on a large table; constraint conflicts if provisioning ever runs concurrently (mitigated by Phase 2 not writing `google_sub` yet).
- **Rollback:** `DROP COLUMN`/drop index via reverse migration or dump restore. Column is additive — safe to remove.

### Phase 4 — Student onboarding redesign
- **Objective:** Auto-provision students on first Google login; one-time Branch/Section/Hostel onboarding screen; picture seed.
- **Files affected (backend):** `services/googleAuth.ts` (provisioning logic), `services/student.ts` (no-op/lookup), `routes/students.ts` or a scoped onboarding route (server-side validation), `services/profile.ts` (unchanged semantics).
- **Files affected (frontend):** new onboarding step (post-login), `Login.tsx`, routing in `App.tsx` for onboarding-only state.
- **Risks:** Duplicate student/user creation under concurrent first logins (mitigate with a transaction + unique constraints + `ON CONFLICT` semantics), roll extraction edge cases (case, formatting).
- **Rollback:** Disable the provisioning branch server-side; students from Google can be redirected to the legacy path if still enabled. Legacy OTP path remains until Phase 6.

### Phase 5 — Faculty/Admin migration
- **Objective:** Faculty/admin Google login binds `google_sub` for existing users; reject unknown faculty emails; admins never auto-created.
- **Files affected:** `services/googleAuth.ts`, `services/faculty.ts` (lookup reuse), `routes/auth.ts`.
- **Risks:** Admin lockout if every admin is bound and Google fails — mitigate by binding all existing admins/faculty during this phase (a backfill script that pre-binds known emails is explicitly forbidden: binding requires a verified token; instead keep password fallback until Phase 6).
- **Rollback:** Keep legacy login active; no account-level changes beyond the nullable `google_sub` write.

### Phase 6 — Removal of legacy authentication
- **Objective:** Delete the subsystems in section 8: OTP services/routes/tables, password services/routes/columns, Excel import, activation pages/APIs, SMTP boot requirement.
- **Files affected:** all rows of the section 8 table.
- **Risks:** Hidden references (imports, tests, seed data, audit-action strings, shared constants). Mitigation: grep sweep for `password`, `otp`, `activation`, `import`, `bcrypt`, `SMTP`; backend test suite is the gate (160 tests must pass with updated auth tests).
- **Rollback:** Restore from git history (large, deliberate commit boundaries per phase) — legacy is gone only after all users have a bound `google_sub` or a verified-email one-time bridge.

### Phase 7 — Regression testing
- **Objective:** Prove sections 12 and 13 — every non-auth subsystem behaves exactly as before.
- **Files affected:** test suites only (`tests/`), plus this document's checklist as acceptance criteria.
- **Risks:** A regression hidden by test changes. Mitigation: keep every pre-existing test that is not auth-specific byte-identical in intent; run the full 160-test suite + frontend tests + manual browser pass.
- **Rollback:** Any failing regression rolls back the smallest phase commit that introduced it.

---

## 12. Regression Requirements

The following MUST behave **exactly** the same before and after the migration:

- **Attendance:** identical.
- **Scanning:** identical (entry/exit via roll barcode, duplicate detection, summary-required gate).
- **Notifications:** identical.
- **Session lifecycle:** identical (`created → active → awaiting_summary → completed/archived`).
- **Profile editing:** identical.
- **Push notifications:** identical.
- **Role permissions:** identical.
- **Analytics / dashboards:** identical.
- **Audit logging:** identical, plus new auth action names.

**Only identity acquisition changes.** Acceptance test: with an authenticated app session, it must be impossible to tell from behavior which login mechanism produced it.

---

## 13. Test Plan (Migration Checklist)

### Backend automated tests
- [ ] `POST /auth/google` — valid `@vnrvjiet.in` token, student: first login provisions user + student (`enrolled`/`active`), returns `{ token, user }` in current shape
- [ ] Student returning login — matched purely by `google_sub`, no duplicate rows, no onboarding re-prompt
- [ ] Student with existing legacy row (email match, `google_sub` null) — linked and permanently bound; second login uses `sub`
- [ ] `google_sub` conflict (already bound to another account) — rejected
- [ ] Faculty login — known faculty email binds and gets `faculty` role JWT
- [ ] Faculty unknown email — rejected, no user created
- [ ] Admin login — known admin binds; **admin never auto-created** (assert no new admin rows)
- [ ] Invalid domain (`@gmail.com`, `@other.edu`) — rejected with `GOOGLE_LOGIN_REJECTED_DOMAIN`
- [ ] Unverified email (`email_verified: false`) — rejected
- [ ] Wrong `aud` / wrong `iss` — rejected
- [ ] Expired token (`exp` in past) — rejected
- [ ] Not-yet-valid token (`iat` in future) — rejected
- [ ] Tampered/random token — rejected
- [ ] Suspended/deactivated user logs in — rejected (same as today)
- [ ] Concurrent first logins for the same new student — exactly one user/student row (transaction/unique constraint verified)
- [ ] Deleted Google account (token gone / Google revokes) — subsequent login fails with Google error; existing session continues until JWT expiry (documented behavior)
- [ ] Revoked token — Google sign-in re-prompts; app JWT still enforces `exp` + middleware
- [ ] Rate limiting on `POST /auth/google`
- [ ] Audit rows created for success, failure, domain rejection, conflict
- [ ] Full legacy suite still passes: **scan (16), domain (45), domain-extended, activation (14), auth (13), auth middleware (8), health, config, errors, errorHandler, logger** — total 160, with activation/password tests replaced by Google tests in Phase 6
- [ ] Frontend tests pass (15)

### Manual browser tests
- [ ] Student first login: Google → onboarding (Branch/Section/Hostel) → Student Dashboard
- [ ] Student returning login: Google → straight to dashboard
- [ ] Faculty login → Faculty Dashboard (scanner, ledger, live students work)
- [ ] Admin login → Admin Dashboard (stats, faculty mgmt, categories, students)
- [ ] Login page shows only "Continue with Google" (no email/password fields after Phase 6)
- [ ] Onboarding required fields enforced; Hostel optional
- [ ] Scanner: entry → exit → summary-required → force exit (unchanged)
- [ ] Notifications + push: entry/exit/completion notifications still delivered
- [ ] Profile: edit branch/section/hostel, upload/remove picture
- [ ] Session lifecycle: created/active/awaiting/completed states behave identically
- [ ] Logout ends the app session; Google session independent
- [ ] Multiple tabs / concurrent sessions with the same account behave as with the current JWT
- [ ] Mobile: Google login works at narrow viewports

---

## 14. Implementation Rules

1. This document is the **migration blueprint**, not implementation. Every future implementation prompt MUST reference it by name (`AUTH_MIGRATION_GOOGLE_OAUTH.md`) and follow it.
2. Implementation must strictly follow the architecture in sections 3–10 and the phase order in section 11.
3. **No shortcuts** — no client-side verification, no trusting client claims, no skipping the domain gate, no concurrent rollout of unplanned changes.
4. **No partial redesign** — authentication is replaced wholesale per section 8; nothing else is redesigned.
5. **No functionality regression** — section 12 is an acceptance contract; the full test suite and the manual checklist are the gate.
6. Each phase lands as its own commit with the old behavior still working until Phase 6.
7. Server-side validation remains mandatory for every new input (onboarding fields, etc.), and every new endpoint gets authorization/rate-limit treatment consistent with the codebase conventions in `AGENTS.md` and `PRINCIPLES.md`.
8. The end state: the Barcode Attendance System is functionally identical except that **identity is acquired through Google OAuth**.

---

*Boundary statement: this document intentionally changes only the authentication subsystem. Attendance, scanning, session lifecycle, notifications, push, profile, dashboards, analytics, audit, and roles are frozen contracts of this migration.*
