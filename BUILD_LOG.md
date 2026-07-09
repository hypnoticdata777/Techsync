# TechSync Build Log

This file tracks hardening and launch-readiness changes as we move TechSync
from local POC toward a hosted POC.

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
- If any Supabase project was already initialized with the previous schema,
  manually remove or rotate the former shared demo users there.

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
- Production backend startup now requires Supabase settings, JWT secret, CORS
  origins, and Stripe/mock checkout callback URLs.
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
