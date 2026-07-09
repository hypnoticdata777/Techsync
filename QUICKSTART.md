# TechSync - Quick Start & Demo Script

## 5-Minute Demo Script

Since TechSync is now multi-tenant, the backend requires a real Supabase
project (there's no more "run with no DB, get mock data" mode — tenant
isolation needs a real database). Budget a couple extra minutes the first
time to create a free Supabase project and run the schema.

### Step 0: One-time Supabase setup

1. Create a free project at https://supabase.com
2. Open the SQL Editor and paste/run the contents of `server/schema.sql`
   (or run `alembic upgrade head` from `server/` with `DATABASE_URL` set to
   your project's direct Postgres connection string)
3. Grab your Project URL and `service_role` key from Project Settings → API

### Step 1: Start the Backend (1 minute)

```bash
cd server
pip install -r requirements.txt

cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
JWT_SECRET_KEY=$(openssl rand -hex 32)
EOF

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:** Open http://localhost:8000/docs — you should see the API documentation

### Step 2: Start the Mobile App (2 minutes)

```bash
cd client
npm install
npm start
```

**In a third terminal:**
```bash
cd client && npm run ios      # or: npm run android
```

**Android Note:** before running on the Android emulator, edit
`client/src/config.js` so `API_BASE_URL` points at
`http://10.0.2.2:8000`.

### Step 3: Demo the Features (2 minutes)

**Onboarding flow (RF-06):**
1. App launches to the login screen
2. Tap "Create Organization"
3. Fill in company name + your admin details, submit
4. You're immediately signed in as `org_admin` for your new org


**Work Order Management:**
1. View existing work orders with status badges
2. Tap "+ Add" to create one (title, description, customer, address,
   service type, priority) — it auto-assigns to the best-fit technician
   if one is available (RF-14)
3. Tap a work order to view details
4. Use the status buttons to walk it through its lifecycle: Open → Start
   Work → Mark Completed (or Cancel at any point) — each transition is
   recorded in the audit log (RF-20)

**Authentication persistence & refresh (RF-01):**
1. Close the app completely, reopen — still logged in
2. Access tokens expire after 15 minutes; the app transparently exchanges
   the refresh token for a new one on the next API call, no re-login needed

**API Testing (Optional):**
```bash
curl http://localhost:8000/health

curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_ADMIN_EMAIL","password":"YOUR_ADMIN_PASSWORD"}'
# -> {"access_token": "...", "refresh_token": "...", "token_type": "bearer"}

curl http://localhost:8000/work-orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Demo Account Setup

Create a demo organization through the onboarding flow, then invite any
technician users you need for the walkthrough. The production schema does not
ship with shared demo credentials.
---

## Key Features to Showcase

1. **Multi-tenant isolation** — every table is scoped by `organization_id`,
   backed by Postgres RLS (see README "Multi-Tenancy Model")
2. **Self-service onboarding** — a brand-new org + admin account in one API
   call, no manual provisioning
3. **Rule-based auto-assignment** — new work orders are matched to a
   technician by skill, proximity, and current workload
4. **Secure Authentication** — short-lived access tokens (15 min) + 7-day
   refresh tokens, bcrypt password hashing
5. **Full audit trail** — every status change and reassignment is logged
   with who/when
6. **Developer Experience** — FastAPI auto-generated docs at `/docs`, a
   pytest suite (`cd server && pytest`), Alembic migrations

---

## Troubleshooting Quick Fixes

**Port 8000 already in use:**
```bash
lsof -i :8000  # Find process
kill -9 PID
```

**Metro bundler cache issues:**
```bash
cd client && npm start -- --reset-cache
```

**Can't connect from mobile app:**
- iOS Simulator: `http://localhost:8000`
- Android Emulator: `http://10.0.2.2:8000`
- Physical Device: `http://YOUR_COMPUTER_IP:8000`

**"503 Service requires database configuration":**
- `SUPABASE_URL`/`SUPABASE_KEY` are missing or wrong in `server/.env` — see
  Step 0 above. There's no mock-data fallback anymore since tenant
  isolation needs a real database.

**Access token expired errors:**
- The mobile app refreshes automatically. Via curl, call
  `POST /auth/refresh` with your `refresh_token`, or just log in again.

---

## What's Running Where

| Component | URL/Location | Purpose |
|-----------|--------------|---------|
| FastAPI Server | http://localhost:8000 | Backend API |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Metro Bundler | http://localhost:8081 | React Native bundler |
| Mobile App | iOS Simulator / Android Emulator | Field service mobile interface |

---

## Next: See Full Documentation

- **Full README:** See `README.md` for architecture, multi-tenancy model,
  full API surface, and spec coverage
- **Spec:** See `Techsync_SaaS_Requirements.md` for the original
  requirements document this implementation targets
