# TechSync Build Log

This file tracks hardening and launch-readiness changes as we move TechSync
from local POC toward a hosted POC.

## 2026-07-21 - Rehydrate Repo and Add Public POC Trackers

### Why

The Desktop `Techsync-main` folder was a GitHub download/zip style folder rather
than a full development checkout. Before hosting or portfolio integration, the
project needs a real clone, verified GitHub/CI state, and the same durable
tracking docs used across the other product POCs.

### Changed

- Cloned the real `hypnoticdata777/Techsync` repo into a working directory with
  full `.git` history.
- Confirmed `main` is aligned with `origin/main` at `3c3f0ac`.
- Confirmed the latest GitHub Actions CI run on `main` completed successfully.
- Added `PUBLIC_POC_READINESS.md` to summarize public-review readiness,
  safety-sweep notes, guardrails, and hosted POC next steps.
- Added `PHASE_STATUS.md` for current phase tracking.
- Added `COMMAND_LOG.md` for command/evidence history.
- Added `QA_CHECKLIST.md` for public POC, hosted backend, demo, and portfolio QA.
- Added `HOSTING_PORTFOLIO_ROADMAP.md` for the host-ready and portfolio-ready
  path.
- Removed tracked generated Python bytecode files from `server/__pycache__`.

### Remaining Follow-Up

- Run an independent `gitleaks` or `trufflehog` scan when available. Completed
  with Gitleaks `8.30.1` on July 21, 2026 in the follow-up scanner slice.
- Choose the backend hosting provider and managed Postgres provider.
- Deploy the backend behind HTTPS with secrets stored in the host secret manager.
- Connect a synthetic demo or walkthrough to the portfolio.

## 2026-07-21 - Run Independent Gitleaks Scan

### Why

The manual high-signal secret scan was useful, but the public POC needs an
independent scanner pass before hosting or portfolio promotion.

### Changed

- Extracted Gitleaks `8.30.1` locally for one-time scanner use.
- Added `.gitleaks.toml` for TechSync-specific scan configuration.
- Ignored local scanner binaries and generated redacted reports in `.gitignore`.
- Rewrote the Quick Start authenticated curl example to use a local `TOKEN`
  variable instead of a bearer-token placeholder.
- Ran Gitleaks against the current working tree.
- Ran Gitleaks against full Git history.

### Result

- Current-tree configured scan: no leaks found.
- Full-history configured scan: no leaks found across 38 commits.
- Local `gitleaks*.json` reports and `tools/gitleaks*/` are intentionally
  ignored and should not be committed.

### Remaining Follow-Up

- Review older docs for stale architecture language before portfolio launch.
- Choose the backend hosting provider and managed Postgres provider.

## 2026-07-09 - Remove Shared Demo Credentials

### Why

Shared demo credentials are unsafe once a service is reachable beyond a local
developer machine. The previous schema inserted a shared demo organization,
admin user, technician user, and sample work order. The mobile login screen and
docs also advertised those credentials.

### Changed

- Removed the idempotent demo seed block from `server/schema.sql`.
- Removed the demo credentials panel from `client/src/screens/LoginScreen.js`.
- Updated `README.md` and `QUICKSTART.md` so demos start from onboarding rather
  than shared accounts.
- Marked the seeded-account checklist item complete, with a note that existing
  databases created from the old schema still need credential rotation/deletion.

### Remaining Follow-Up

- Run a secret/history scan before making the repo public.
- If any existing database was already initialized with the previous schema,`n  manually remove or rotate the former shared demo users there.

## 2026-07-09 - Make Production Configuration Explicit

### Why

The client previously had a hardcoded placeholder production API URL, and the
backend had placeholder Stripe callback defaults. Those values can make a
hosted POC fail in confusing ways or accidentally point users at fake domains.

### Changed

- Client API configuration now reads `EXPO_PUBLIC_API_BASE_URL` and fails fast
  in production builds when it is missing.
- Backend settings now support `APP_ENV=production` and validate required
  production values at startup.
- Production backend startup now requires `DATABASE_URL`, object storage settings,`n  JWT secret, CORS origins, and Stripe/mock checkout callback URLs.
- Production CORS validation rejects localhost origins.
- `.env.example`, README, Quick Start, and mobile config docs now describe the
  deployment variables explicitly.

### Remaining Follow-Up

- Set real values in the hosting provider secret manager before deploying.
- Use real HTTPS domains for `CORS_ORIGINS`, `STRIPE_SUCCESS_URL`,
  `STRIPE_CANCEL_URL`, and `EXPO_PUBLIC_API_BASE_URL`.

## 2026-07-09 - Send Reset and Invitation Emails

### Why

Password reset and invitation tokens were previously written to logs. That kept
local demos simple, but it is unsafe and unusable for a hosted POC.

### Changed

- Added `services/email_service.py` with SMTP delivery and explicit local-dev
  log delivery mode.
- Password reset requests now send through the email service instead of route-level token logging.
- Organization invitations now send through the email service instead of route-level token logging.
- Production startup now requires `APP_BASE_URL`, `EMAIL_FROM`, SMTP settings,
  and `EMAIL_DELIVERY_METHOD=smtp`.
- Updated `.env.example`, README, Quick Start, and the pre-launch checklist.

### Remaining Follow-Up

- Choose the production email provider and store SMTP credentials in the host's
  secret manager.
- Replace token-copy mobile flows with first-class deep-link handling when the
  app store/mobile deployment path is ready.

## 2026-07-09 - Add CI Test Pipeline

### Why

A public POC needs a repeatable safety net so auth, tenant isolation, matching,
and client validation do not regress silently between demos.

### Changed

- Added a GitHub Actions workflow with separate backend and client jobs.
- Backend CI installs `server/requirements-dev.txt` and runs the 45-test pytest suite.
- Client CI installs with `npm ci` and runs Jest in CI mode.
- Added `client/src/utils/validation.test.js` to cover shared email and password validation behavior.
- Updated README test instructions and marked the CI checklist item complete.

### Remaining Follow-Up

- Expand client tests around authentication and onboarding screens.
- Complete the Expo/React Native major upgrade needed to clear the remaining npm audit findings.

## 2026-07-09 - Reduce Client Dependency Audit Findings

### Why

A public showcase should not carry easy-to-fix dependency advisories, but this
Expo/RN stack also needs framework compatibility respected. The safe path is to
apply lockfile-level fixes first and keep the framework upgrade as a separate
planned blocker.

### Changed

- Ran `npm audit fix --package-lock-only` without `--force`.
- Updated `client/package-lock.json` with patched transitive packages including Babel, minimatch, picomatch, js-yaml, lodash, and React Native's nested `ws`.
- Reinstalled with `npm ci` and confirmed the remaining audit count is 29 findings, down from 39, with zero critical findings.
- Documented that the remaining findings require an Expo/React Native framework upgrade rather than forced transitive overrides.

### Remaining Follow-Up

- Plan and test the Expo/RN upgrade path that npm identifies as the supported fix for the remaining audit findings.
- Re-run mobile/web smoke tests after that upgrade because it is a framework-level change.

## 2026-07-09 - Rate Limit Public Auth Flows

### Why

Login, password reset, organization onboarding, and invitation acceptance are
reachable before a user is authenticated. A hosted POC needs basic abuse
protection before those endpoints are exposed publicly.

### Changed

- Added dependency-free fixed-window rate limiting in `core/rate_limit.py`.
- Applied configurable limits to `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/organizations/onboard`, and `/invitations/accept`.
- Added `RATE_LIMIT_*` environment variables to `server/.env.example`.
- Added unit coverage for window resets, per-client/per-rule scoping, 429 responses, disable mode, and trusted proxy header behavior.

### Remaining Follow-Up

- For multi-instance production hosting, move counters to Redis or enforce equivalent limits at the edge/reverse proxy.
- Keep `RATE_LIMIT_TRUST_PROXY_HEADERS=false` unless the API only receives traffic from a trusted proxy.

## 2026-07-10 - Handle Stripe Webhooks

### Why

Checkout sessions alone do not update tenant subscription state. A hosted POC
using real Stripe test mode needs a signed webhook endpoint so payment events
can activate, mark past-due, or cancel subscriptions automatically.

### Changed

- Added `STRIPE_WEBHOOK_SECRET` config and production validation when Stripe is configured.
- Added `POST /billing/webhook` with Stripe signature verification.
- Handles `checkout.session.completed`, `invoice.payment_failed`, and `customer.subscription.deleted`.
- Stores Stripe customer/subscription IDs and updates plan/subscription status through the organization repository.
- Expanded backend billing tests for webhook verification and event handling.

### Remaining Follow-Up

- Configure the real Stripe webhook endpoint URL and signing secret in the hosting provider.
- Use Stripe CLI or dashboard test events against the deployed backend before enabling real customer demos.

## 2026-07-10 - Move Mobile Tokens to Secure Storage

### Why

Auth access and refresh tokens were still stored in AsyncStorage, which is not
OS-backed secure storage. A public-facing POC should avoid leaving bearer
tokens in plain app storage on mobile devices.

### Changed

- Added `expo-secure-store` to the Expo client.
- Added `client/src/utils/tokenStorage.js` as the single token persistence adapter.
- Updated `AuthContext` to load, save, refresh, and clear tokens through the adapter instead of AsyncStorage.
- Added Jest coverage for native secure-store save/load/clear behavior.
- Updated README and the pre-launch checklist to mark RF-04 complete for native mobile builds.

### Remaining Follow-Up

- Re-test a real Android/iOS build after the next native rebuild.
- Treat Expo web preview auth as demo-only: it falls back to browser session storage or memory because browser JavaScript cannot use the mobile OS Keychain/Keystore.

## 2026-07-10 - Upload Work Order Attachments

### Why

RF-19 was still demo-incomplete: the API could store attachment URLs, but the
app had no real photo upload path and the backend did not place files in object
storage. For a public POC, attaching field evidence to a work order should work
end-to-end.

### Changed

- Added configurable S3-compatible storage settings for the work-order attachments bucket and max upload size.
- Added a backend upload service that validates image/PDF content type, size, and filename safety before uploading to S3-compatible object storage.
- Added `POST /work-orders/{id}/attachments/upload` while keeping the existing metadata endpoint compatible.
- Added backend tests for upload path generation, S3-compatible storage calls, content-type rejection, size rejection, and extension mismatch rejection.
- Added `expo-image-picker` plus camera/photo-library permissions to the mobile app.
- Updated the work order details screen to load attachments, take or choose a photo, upload it, and open existing attachments.
- Updated README and the pre-launch checklist to mark RF-19 complete for the hosted POC path.

### Remaining Follow-Up

- Create the `work-order-attachments` bucket in the chosen object-storage provider before the hosted demo.
- Smoke-test photo capture/upload on a real Android/iOS build after the next native rebuild.
## 2026-07-10 - Remove Supabase Runtime Dependency

### Why

Supabase was no longer the chosen foundation for the hosted POC. The backend
already owned auth, tenant scoping, migrations, and file upload endpoints, so a
portable managed-Postgres plus S3-compatible storage architecture is a better
fit for the public demo path.

### Changed

- Added `server/database.py` for direct SQLAlchemy/psycopg2 Postgres access via `DATABASE_URL`.
- Migrated runtime repositories from `supabase-py` query-builder calls to explicit Postgres SQL/helper calls.
- Replaced `supabase` with `boto3` in backend requirements.
- Reworked attachment uploads to use S3-compatible `put_object` storage and public base URLs.
- Removed the obsolete `server/supabase_client.py` runtime helper.
- Updated tenant-isolation tests to assert direct SQL/helper scoping by `organization_id`.
- Updated `.env.example`, README, and the pre-launch checklist for managed Postgres plus S3/R2-style storage.

### Remaining Follow-Up

- Choose the hosted providers (for example Neon/Render Postgres plus Cloudflare R2) and provision real credentials.
- Run `alembic upgrade head` against the production/demo Postgres database.
- Smoke-test attachment upload against the chosen object-storage bucket.
## 2026-07-10 - Run Local Secret History Scan

### Why

Before the repo can be public or used as a showcase, we need confidence that no
real production-style secrets were committed anywhere in Git history.

### Changed

- Checked for `gitleaks` and `trufflehog`; neither was installed locally.
- Ran a local full-history scan across 46 commits for high-signal secret patterns: private keys, AWS/S3 access keys, Stripe keys/webhook secrets, Postgres URLs with embedded passwords, JWT secret assignments, SMTP passwords, storage secret assignments, Supabase service-role markers, and Supabase project URLs.
- The scan found 36 unique findings, all limited to Supabase-era placeholder/docs markers such as `https://your-project.supabase.co` and `your-service-role-key`; no high-confidence real secrets were found.
- Updated `VSCODE_SETUP_GUIDE.md` so active setup instructions now reference managed Postgres and S3-compatible storage instead of Supabase placeholders.
- Marked the critical secret-scan checklist item complete, with a note to run `gitleaks` or `trufflehog` later as an independent second pass if either tool is installed.

### Remaining Follow-Up

- Run an independent scanner (`gitleaks` or `trufflehog`) before making the repository public if one is installed in the deployment/release environment.
- Refresh the older technical appendix before public showcase; it still describes the historical Supabase architecture rather than the current managed-Postgres/S3-compatible path.
