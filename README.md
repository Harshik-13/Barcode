# 8Hour Workspace Attendance System

Role-based platform that records student attendance and daily work activity inside the startup workspace.

## Overview

This project adapts an existing barcode scanner PWA (Campus Passport) from hostel meal attendance to workspace attendance. The system tracks student entry, exit, work categories, and work summaries with role-based dashboards for students, faculty, and admins.

## Documentation

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Locked architecture, domain model, API design |
| `PRINCIPLES.md` | Engineering principles, security, definition of done |
| `ROADMAP.md` | Implementation phases and migration plan |
| `AGENTS.md` | Conventions for AI agents |

## Project Structure

```
passport/
├── passport-pwa/         # Student PWA (React + Vite + TS) — TO BE ADAPTED
├── vjscanner-pwa/        # Faculty scanner PWA (React + Vite + TS) — TO BE ADAPTED
└── api-server/           # Node.js + Express + SQLite backend — TO BE ADAPTED
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (PWA)
- **Backend**: Node.js + Express + better-sqlite3
- **Auth**: Google OAuth + JWT
- **Scanning**: html5-qrcode (camera-based QR/barcode)
- **Database**: SQLite

## Core Workflow

1. **Faculty scans** student barcode → creates WorkspaceSession (pending)
2. **Student notified** → selects work category → session becomes active
3. **Faculty scans** on exit → closes session
4. **Student notified** → submits work summary → session completed
