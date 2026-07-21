# TechSync Public POC Readiness

Date: July 21, 2026

## Current Status

TechSync is a public-facing proof of concept for a multi-tenant field-service
SaaS platform. It is suitable for portfolio and investor review as an
architecture/product POC, but it should not yet be treated as production-ready
for real customer operations.

The current repo is aligned with GitHub:

```text
Repository: https://github.com/hypnoticdata777/Techsync
Branch: main
Latest verified commit: 05626ac Document TechSync public POC readiness and tracker docs
Latest verified CI run before this scan: success on main for 3c3f0ac
```

## What Is Public-Review Ready

- Multi-tenant organization model.
- Role-based auth and onboarding/invitation flows.
- Work-order lifecycle APIs and mobile screens.
- Technician assignment and status-transition flow.
- CSV and webhook ingestion boundaries.
- Matching engine based on skill, proximity, workload, and priority.
- Billing checkout/webhook boundary for Stripe test-mode style demos.
- Attachment metadata and S3-compatible upload boundary.
- Application-layer tenant scoping covered by regression tests.
- Postgres RLS policies included as a database-level backstop.
- CI workflow for backend pytest and client Jest checks.
- Launch-hardening docs and pre-launch checklist.

## Safety Sweep Notes

The July 21, 2026 local safety sweep checked the freshly cloned repo, not the
zip-style Desktop download.

Observed:

- `.git` exists in the working clone.
- `main` is aligned with `origin/main`.
- `.gitignore` excludes `.env`, `*.env`, build folders, Node modules, native
  mobile signing artifacts, generated app packages, logs, and caches.
- Only `server/.env.example` was found in the env-file scan.
- High-signal secret strings found in tracked files are placeholder/docs/test
  values, including example Postgres URLs, placeholder JWT/storage/SMTP values,
  Stripe webhook placeholders, and test-only `whsec_test` values.
- No tracked `.env`, database dump, SQLite file, PDF, CSV, zip, APK, AAB, private
  key, or production key file was found in the local file scan.
- Tracked Python bytecode files were removed because generated cache files do
  not belong in the public POC repo.
- Gitleaks `8.30.1` was run against the current tree and full Git history with
  `.gitleaks.toml`; both configured scans reported no leaks.
- `.gitleaks.toml` keeps local scanner artifacts ignored and allowlists the
  documented localhost curl token placeholder in `QUICKSTART.md`.
- Older public-facing docs were reviewed for stale Supabase/single-tenant
  language. Historical docs now carry explicit historical notices, and the SaaS
  requirements reference stack now reflects the current managed-Postgres and
  S3-compatible runtime path.

Notes:

- `client/android/app/debug.keystore` is tracked. This is the standard Android
  debug keystore pattern, not a production signing key. Do not use it for app
  store or production release signing.
- The first unconfigured Gitleaks scan flagged a docs-only curl bearer-token
  placeholder in `QUICKSTART.md`; the example was rewritten to use a local
  `TOKEN` variable and the configured Gitleaks scan now passes.

## Not Production Ready Yet

Before real customer data, real money, or public self-serve usage:

- Generate and store a real production `JWT_SECRET_KEY`.
- Provision a dedicated production/demo managed Postgres database.
- Use the Neon pooled connection string if the backend runs on a serverless
  host such as Vercel.
- Run Alembic migrations against that database.
- Host the backend behind HTTPS.
- Configure production CORS with real hosted domains only.
- Store all runtime secrets in the host secret manager.
- Configure real SMTP delivery, or explicitly run a hosted demo mode where
  email delivery is deferred.
- Configure and test Stripe webhook delivery against the hosted backend before
  enabling any live billing demo. Stripe is deferred for the first investor POC.
- Configure object storage and smoke-test attachment upload if attachment upload
  is part of the hosted demo. Cloudflare R2 is the preferred S3-compatible
  storage candidate; storage is deferred for the first smoke test unless RF-19
  must be shown live.
- Add error monitoring.
- Add uptime monitoring.
- Confirm managed Postgres backups and recovery policy.
- Complete the Expo/React Native dependency upgrade and mobile regression pass.
- Add privacy policy and terms before real customer data.

## Public Demo Guardrails

- Use synthetic organizations, users, technicians, work orders, and attachments.
- Do not expose real customer or technician data.
- Do not publish `.env` files or production secrets.
- Do not present shared long-lived demo credentials unless the environment is
  disposable and resettable.
- Do not claim push notifications, offline sync, PDF/email ingestion, app-store
  readiness, web admin UI, or production scale until those items are actually
  completed.

## Recommended Next Step

Proceed to hosted POC setup:

1. Use Neon Postgres for the demo database.
2. Choose the backend host: Vercel for portfolio alignment, or Render/Railway
   for a more traditional FastAPI service.
3. Decide whether to add a demo deployment mode or configure full production
   requirements for SMTP and object storage.
4. Configure host secrets.
5. Deploy the backend behind HTTPS.
6. Verify `/health`, onboarding, login/refresh, work-order creation, assignment,
   status transitions, CSV ingestion, dashboard metrics, and attachment flow if
   storage is configured.
7. Connect the synthetic demo or walkthrough from the portfolio once the
   portfolio URL exists.

## Stop Point For This Phase

Stop when TechSync is:

- hosted in a controlled POC environment;
- connected from the portfolio;
- using synthetic/demo data only;
- passing CI;
- smoke-tested through the core journey;
- documented with production limitations and next steps.

At that point, TechSync is investor-safe as a public POC and should pause before
production-only work such as app-store release, push notifications, offline
sync, advanced reporting, or real customer onboarding.
