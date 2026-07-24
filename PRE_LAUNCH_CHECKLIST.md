# Pre-Launch Checklist

What's left between "POC on a laptop" and "live on my website." Grouped by
priority — do **Critical** before anyone but you touches it, **Important**
before real customer data goes in, **Nice-to-have** can trail behind launch.

---

## 🔴 Critical — do before it's reachable by anyone but you

- [x] **Rotate/remove the seeded demo accounts.** Shared demo accounts are no
      longer seeded by server/schema.sql or displayed in the mobile login
      screen. If an environment was already created from the older schema,
      delete or rotate those users in that DB.
- [ ] **Generate a real `JWT_SECRET_KEY`** for production (`openssl rand
      -hex 32`) — never reuse the one from local dev, never commit it.
      Store it in your hosting provider's secret manager, not in a
      committed `.env`.
- [ ] **Create a production managed Postgres database** (separate from any dev/test database) and run `alembic upgrade head` against it. Keep `DATABASE_URL` only in the backend host secret manager.
- [ ] **Put the backend behind HTTPS** (RNF-04 requires TLS, no
      exceptions). If you deploy to Render/Fly.io/Railway/Vercel this is
      usually automatic; if you're running the Docker image yourself, put
      it behind a reverse proxy (Caddy/Nginx/Cloudflare) with a real cert.
- [ ] **Lock down CORS** - production mode now fails startup if
      `CORS_ORIGINS` is missing or contains localhost. Set `APP_ENV=production`
      and configure `CORS_ORIGINS` to your actual production domain(s) only.
- [x] **Add hosted demo config mode.** `APP_ENV=demo` requires real hosted
      URLs, locked-down CORS, `DATABASE_URL`, and `JWT_SECRET_KEY`, while
      allowing SMTP, storage, and Stripe to be intentionally deferred for the
      first investor-safe POC. Use `APP_ENV=production` before real customers.
- [x] **Wire up real password-reset and invitation emails.** The backend
      now sends reset and invitation emails through `services/email_service.py`.
      Local development can use `EMAIL_DELIVERY_METHOD=log`; production
      requires SMTP settings and `APP_BASE_URL` at startup.
- [x] **Run a secret scan** over the whole repo history before making it
      public. A local full-history scan across 46 commits found no
      high-confidence real database/storage/Stripe/JWT/SMTP/private-key
      secrets; findings were limited to placeholder Supabase-era docs. If
      `gitleaks` or `trufflehog` is installed later, run one as an independent
      second pass before flipping the repo public.
## 🟠 Important — do before real customer data / real money touches this

- [x] **Add Stripe webhook handling.** `POST /billing/webhook` now verifies
      Stripe signatures with `STRIPE_WEBHOOK_SECRET` and handles
      `checkout.session.completed`, `invoice.payment_failed`, and
      `customer.subscription.deleted` to update tenant subscription state.
- [x] **Rate-limit the auth endpoints** (`/auth/login`,
      `/auth/forgot-password`, `/auth/reset-password`, `/organizations/onboard`,
      `/invitations/accept`). The backend now has configurable in-process fixed
      window limits for single-instance POC hosting. For multi-instance hosting,
      move these limits to Redis or the edge/reverse proxy.
- [x] **Remove the Supabase service-role runtime dependency.** Repositories now use direct Postgres via `DATABASE_URL`, storage uses S3-compatible credentials, and tenant isolation is enforced through app-layer `organization_id` scoping covered by regression tests.
- [x] **Wire up real object storage for attachments (RF-19).** The backend
      now uploads files through S3-compatible object storage and records attachment
      metadata; the mobile work order details screen can take or choose a
      photo and attach it to the job.
- [x] **Move mobile token storage off AsyncStorage** (RF-04). Native app
      tokens now persist through `expo-secure-store`, which uses OS-backed
      secure storage on Android/iOS. Expo web preview falls back to browser
      session storage or memory because browsers do not expose the mobile
      Keychain/Keystore API.
- [ ] **Add error monitoring** (Sentry or similar) on both the FastAPI
      backend and the mobile app — right now failures only show up in
      `LOG_FORMAT=json` logs, which nobody's watching in real time.
- [ ] **Set up basic uptime monitoring** (UptimeRobot, Better Uptime, or
      your host's built-in health checks against `GET /health`).
- [ ] **Confirm managed Postgres automated backups are enabled** on the production
      project (paid tiers include point-in-time recovery — check your plan).
- [x] **Add a CI pipeline** (GitHub Actions) that runs backend pytest and
      client Jest checks on pushes/PRs. Backend coverage currently includes
      `server/tests/` (63 tests); client coverage starts with shared validation tests and should grow as mobile flows are hardened.
- [ ] **Complete the Expo/React Native dependency upgrade.** Safe npm audit
      fixes reduced the client report from 39 to 29 findings with no criticals,
      but the remaining high/moderate findings are pinned inside Expo 50 / React
      Native 0.73 tooling. Clearing them requires a planned Expo/RN upgrade and
      mobile/web regression pass, not `npm audit fix --force` in-place.

## 🟡 Nice-to-have — can trail behind initial launch

- [ ] **Real push notifications** (RF-16) via FCM/APNs — technicians
      currently just get a structured log line when assigned
      (`services/notification_service.py`), no actual phone notification.
- [ ] **Offline sync for the mobile app** (RF-23) — deferred per the
      original spec's own scope notes.
- [ ] **PDF / web-form / email ingestion** (RF-10, RF-13) — CSV and
      webhook ingestion are live; these two were marked Should/Could and
      deferred.
- [ ] **A real web admin panel** — `GET /dashboard/metrics` and the
      technician-management endpoints exist as an API, but there's no
      web UI consuming them yet (RF-25/RF-26 spec assumed a "panel
      administrativo").
- [ ] **Per-org configurable priority rules UI** (RF-17) — the backend
      table and matching-engine hook exist (`org_priority_rules`), no
      settings screen to manage them yet.
- [ ] **Load-test against the RNF targets** — p95 < 300ms on CRUD, < 2s
      on matching, 20 orgs / 500 concurrent work orders (RNF-01–03). Not
      verified at any real scale yet.
- [ ] **Legal**: privacy policy + terms of service (you're storing
      customer PII and technician location data across multiple tenants —
      worth a lawyer's eyes, not just a POC boilerplate).
- [ ] **App Store / Play Store submission** — signing certs, app icons,
      screenshots, store listing copy, privacy nutrition labels.

---

## Quick reference: what's already solid

No action needed here — just context for why it's not on the list above:
tenant isolation (app-layer + RLS, manually verified against real
Postgres), JWT access/refresh rotation, bcrypt password hashing, Alembic
migrations, the matching engine, audit logging, and the pytest suite. See
`README.md` → "Spec Coverage" for the full implemented-vs-deferred mapping
against the original requirements doc.
