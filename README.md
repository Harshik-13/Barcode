# 8Hour Workspace Attendance System

Role-based platform that records student attendance and daily work activity inside the startup workspace.

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Tests](https://img.shields.io/badge/tests-160%20passing-brightgreen)
![Version](https://img.shields.io/badge/version-ReadyVersion--1.1-blue)

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
- **Authentication** — JWT-based login, OTP activation, password change/reset
- **Security** — IDOR protection, rate limiting, audit logging, session invalidation on password change

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

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workspace.com | admin123 |
| Faculty | faculty@workspace.com | faculty123 |
| Student | student@workspace.com | student123 |

### Run Tests

```bash
cd backend
npm test    # 160 tests across 11 test suites
```

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Auth**: JWT (email/password)
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
