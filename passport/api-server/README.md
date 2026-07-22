# Campus Passport API Server

Node.js + Express + SQLite backend.

## Prerequisites

- Node.js 20 LTS is recommended (native module).
	- This project uses `better-sqlite3` which provides prebuilt binaries for LTS Node versions.
	- Very new Node versions (e.g., 23.x) may fail to build from source.
	- Use `nvm` and the provided `.nvmrc` in the repo root:

```bash
nvm use       # selects Node 20
nvm install   # installs if missing
```

- Linux build tools (if prebuild download is unavailable):

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 make g++ libsqlite3-dev
```

## Setup

```bash
npm install
cp .env.example .env
# Edit .env as needed
npm run migrate
npm start
```

If you see build errors during `npm install` for `better-sqlite3` on a remote system:

- Ensure you are on Node 20 LTS (`nvm use`).
- Install the system packages listed above.
- Optionally rebuild: `npm rebuild better-sqlite3`

## CORS configuration

By default, the API allows requests from localhost dev ports and `https://passport.vjstartup.com`.
To customize, set a comma-separated env var:

```bash
export ALLOWED_ORIGINS="https://passport.vjstartup.com,https://dev-passport.vjstartup.com"
npm start
```

## Endpoints

- `POST /api/auth/login` — stub OAuth, returns JWT, roll, hostelId, name (accepts { email, name? })
- `GET /api/student/secret` — returns encrypted secret for logged-in student
- `POST /api/verify/online` — verifies a QR code
- `POST /api/sync/logs` — accepts array of scan logs
- `GET /api/sync/hostel-keys?hostelId=H1` — returns key bundle for a hostel

### Memberships (new)

- `POST /api/memberships/assign` — body: `{ roll, kind, value }` (e.g., `{ roll:"24071A0301", kind:"event", value:"Event1" }`)
- `GET /api/sync/memberships?kind=hostel&value=BH1` — returns `{ kind, value, rolls:[...] }` for offline authorization bundles

Notes:
- Unknown rolls now map to `hostelId = NONE` to decouple login from hostel rosters (faculty/day scholars).
- Seeded hostels include `BH1`, `GH1`, and `NONE`.
