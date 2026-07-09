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
