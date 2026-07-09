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
- [ ] **Create a production Supabase project** (separate from any dev/test
      project) and run `alembic upgrade head` (or paste `schema.sql`)
      against it. Use the `service_role` key only on the backend server,
      never ship it to the mobile app or a browser.
- [ ] **Put the backend behind HTTPS** (RNF-04 requires TLS, no
      exceptions). If you deploy to Render/Fly.io/Railway/Vercel this is
      usually automatic; if you're running the Docker image yourself, put
      it behind a reverse proxy (Caddy/Nginx/Cloudflare) with a real cert.
- [ ] **Lock down CORS** - production mode now fails startup if
      `CORS_ORIGINS` is missing or contains localhost. Set `APP_ENV=production`
      and configure `CORS_ORIGINS` to your actual production domain(s) only.
- [x] **Wire up real password-reset and invitation emails.** The backend
      now sends reset and invitation emails through `services/email_service.py`.
      Local development can use `EMAIL_DELIVERY_METHOD=log`; production
      requires SMTP settings and `APP_BASE_URL` at startup.
- [ ] **Run a secret scan** over the whole repo history before making it
      public (`git log` + tools like `gitleaks` or `trufflehog`) — confirm
      no real Supabase/Stripe/JWT keys were ever committed, only the
      `.env.example` placeholders.

## 🟠 Important — do before real customer data / real money touches this

- [ ] **Add Stripe webhook handling.** `services/billing_service.py`
      creates a Checkout Session, but nothing listens for
      `checkout.session.completed` / `invoice.payment_failed` to actually
      flip `organizations.subscription_status` — right now
      `mark_subscription_active()` exists but nothing calls it
      automatically. Add a `POST /billing/webhook` endpoint verified with
      your Stripe webhook signing secret.
- [ ] **Rate-limit the auth endpoints** (`/auth/login`,
      `/auth/forgot-password`, `/organizations/onboard`) — nothing stops
      brute-forcing right now. Something simple (slowapi, or your
      reverse proxy's rate limiting) is enough for launch.
- [ ] **Decide on the RLS/service-role gap.** The backend currently uses
      the Supabase `service_role` key, which bypasses Row Level Security —
      application-layer `organization_id` scoping is the real enforcement
      today (see README "Multi-Tenancy Model"). Before this holds real
      customer data, either (a) accept and document that app-layer
      scoping is your primary control and add automated regression tests
      that fail loudly if a repository function ever drops its
      `organization_id` filter, or (b) do the work to issue
      PostgREST-compatible JWTs with an `organization_id` claim and switch
      reads to the `anon`/`authenticated` key so RLS is actually live in
      production, not just verified manually in dev.
- [ ] **Wire up real object storage for attachments (RF-19).** The
      `/work-orders/{id}/attachments` endpoint only stores a URL you give
      it — there's no upload endpoint yet. Set up a Supabase Storage
      bucket (or S3) and add the actual "upload a photo" flow in the
      mobile app.
- [ ] **Move mobile token storage off AsyncStorage** (RF-04). Tokens are
      currently in plain AsyncStorage, not the OS Keychain/Keystore.
      Swap in `react-native-keychain` or `expo-secure-store` — this needs
      a native rebuild, budget time to re-test the Android/iOS build
      afterward given this repo's build history has been fragile.
- [ ] **Add error monitoring** (Sentry or similar) on both the FastAPI
      backend and the mobile app — right now failures only show up in
      `LOG_FORMAT=json` logs, which nobody's watching in real time.
- [ ] **Set up basic uptime monitoring** (UptimeRobot, Better Uptime, or
      your host's built-in health checks against `GET /health`).
- [ ] **Confirm Supabase automated backups are enabled** on the production
      project (paid tiers include point-in-time recovery — check your plan).
- [ ] **Add a CI pipeline** (GitHub Actions) that runs `pytest` on every
      push/PR so a broken auth flow can't merge silently. The suite is
      already there (`server/tests/`, 45 tests) — it's just not wired to
      run automatically yet.

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
