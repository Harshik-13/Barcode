# Hive — Where Ideas Work Together.

Role-based platform that records student attendance and daily work activity inside the startup workspace.

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Tests](https://img.shields.io/badge/tests-177%20passing-brightgreen)
![Version](https://img.shields.io/badge/version-ReadyVersion--1.4-blue)

---

## Features

- **Role-based access** — Admin, Faculty, and Student dashboards with role-specific views
- **QR/Barcode scanning** — Camera-based entry/exit scanning via `html5-qrcode`
- **Session lifecycle** — Entry → Active → Summary → Completed with auto-completion
- **Notifications** — Real-time push notifications for entry/exit/completion events
- **Student stats** — Session history with duration tracking, streaks, category breakdown
- **Faculty review** — Approve/reject sessions with feedback
- **Management** — Students, categories, sessions, activity logs, faculty management
- **Student import** — Bulk import from `.xlsx` with branch/section mapping
- **Authentication** — Google OAuth with `@vnrvjiet.in` domain gate (`/api/auth/google`), JWT session tokens
- **Security** — IDOR protection, rate limiting, audit logging, Google OAuth domain gating

---

## Quick Start

### Prerequisites

- **PostgreSQL 15+** running on `localhost:5432`
- **Node.js 18+**

### Backend Setup

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if your PG password differs
npm install
node scripts/create-db.js   # creates 'workspace' database
node scripts/create-test-db.js  # creates 'workspace_test' database
npm run build
npm run dev                 # starts on port 8080 (auto migrate + seed)
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts on port 5173
```

### Default Credentials

Google OAuth is the only login method. All accounts must use `@vnrvjiet.in` emails. Seeded users (admin@workspace.com, faculty@workspace.com, student@workspace.com) are pre-provisioned and can sign in via Google.

### Run Tests

```bash
cd backend
npm test    # 177 tests across 12 test suites
```

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Auth**: Google OAuth (`/api/auth/google`) + JWT session tokens
- **Scanning**: html5-qrcode (camera-based QR/barcode)
- **Database**: PostgreSQL (node-postgres)
- **Email**: Nodemailer (Gmail SMTP)
- **Push**: web-push (VAPID)
- **Testing**: Vitest + Supertest

---

## Core Workflow

1. **Faculty scans** student barcode → creates workspace session
2. **Faculty exits** session on second scan → session awaits summary
3. **Summary submitted** → session completed
4. **Admin** can scan, manage categories, view audit logs

---

## Project Structure

```
├── backend/           # REST API server (Express + PostgreSQL)
│   ├── src/
│   │   ├── config/    # App configuration
│   │   ├── db/        # Database setup, migrations, seeds
│   │   ├── middleware/ # Auth, rate limiting, logging, security
│   │   ├── routes/    # API route handlers
│   │   ├── services/  # Business logic
│   │   └── utils/     # Validation, errors, pagination, logger
│   └── tests/         # Integration and unit tests
├── frontend/          # Single React PWA
│   └── src/
│       ├── components/# Reusable UI components
│       ├── pages/     # Route pages
│       ├── services/  # API client
│       └── store/     # Auth context
├── shared/            # Shared types, constants, validators
```

---

## Documentation

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System architecture and domain model |
| `PRINCIPLES.md` | Engineering principles and security |
| `AGENTS.md` | Conventions for AI agents |
| `AUTH_MIGRATION_GOOGLE_OAUTH.md` | Google OAuth migration blueprint (phases, test plan) |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and edit:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/workspace` | Main database |
| `JWT_SECRET` | `change-me-in-production` | Token signing key |
| `JWT_EXPIRY_HOURS` | `12` | Token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed origins |
| `SMTP_HOST` | `smtp.gmail.com` | Email server |
| `SMTP_USER` | — | Gmail address |
| `SMTP_PASS` | — | Gmail app password |
| `VAPID_PUBLIC_KEY` | — | Push notification public key |
| `VAPID_PRIVATE_KEY` | — | Push notification private key |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend origin (for reset links) |
| `STUDENT_EMAIL_DOMAIN` | `@vnrvjiet.in` | Student email domain |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID (enables `/api/auth/google`) |
| `GOOGLE_JWKS_URI` | `https://www.googleapis.com/oauth2/v3/certs` | Google public keys (override for testing) |
| `ALLOWED_EMAIL_DOMAINS` | `@vnrvjiet.in` | Comma-separated domain allowlist for Google login |
| `AUTH_RATE_LIMIT_MAX` | `10` | Login attempts per window on auth endpoints |

Frontend env (`frontend/.env`): `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID` (must match `GOOGLE_CLIENT_ID` for the Google button to render).

---

## Google OAuth Setup (Google login)

1. **Create an OAuth client** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create Credentials → OAuth client ID → **Web application**.
2. **Authorized JavaScript origins** — add exactly `http://localhost:5173` (no trailing slash; add your production origin later).
3. **OAuth consent screen** — in *Testing* mode, add the `@vnrvjiet.in` accounts that should sign in as **Test users** (or publish the app).
4. **Env vars** — set the same client ID in both files, then restart both dev servers:

   ```bash
   # backend/.env
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com

   # frontend/.env
   VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```

Only verified `@vnrvjiet.in` accounts pass the server-side domain gate (configurable via `ALLOWED_EMAIL_DOMAINS`). The Google button appears on the login page only when `VITE_GOOGLE_CLIENT_ID` is set.
