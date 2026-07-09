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