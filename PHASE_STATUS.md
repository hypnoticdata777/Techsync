# TechSync Phase Status

Date: July 23, 2026

This file is the current project pulse. Update it after each build, QA, hosting,
or portfolio-integration slice so future sessions can resume without guessing.

## Current Position

TechSync is moving from a local/public code POC into a hosted,
portfolio-connected, investor-safe public POC.

Current verified repo state:

```text
Repository: https://github.com/hypnoticdata777/Techsync
Branch: main
Latest verified commit before scanner-doc update: 05626ac Document TechSync public POC readiness and tracker docs
Latest verified CI run before scanner-doc update: success on main for 3c3f0ac
Working clone: C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync
```

## Phase Map

### Phase 0 - Rehydrate the Repo Correctly

Status: complete

Completed:

- Cloned the real GitHub repo with full `.git` history.
- Confirmed `main` is aligned with `origin/main`.
- Confirmed `HEAD` is `3c3f0ac Document secret history scan`.
- Confirmed GitHub Actions CI succeeded on `main` for `3c3f0ac`.
- Confirmed the Desktop `Techsync-main` folder was a zip/download style folder,
  not the active development checkout.

### Phase 1 - Public POC Safety Sweep

Status: in progress

Completed:

- Added `PUBLIC_POC_READINESS.md`.
- Confirmed `.gitignore` excludes `.env`, `*.env`, generated packages, build
  folders, logs, caches, and native signing artifacts.
- Confirmed only `server/.env.example` appeared in the env-file scan.
- Ran high-signal secret-pattern scan across tracked files.
- Confirmed scan hits were placeholder/docs/test values, not live secrets.
- Confirmed no tracked `.env`, database dump, SQLite file, PDF, CSV, zip, APK,
  AAB, private key, or production key file appeared in the local file scan.
- Removed tracked Python bytecode files from `server/__pycache__`.
- Added execution tracker docs: `PHASE_STATUS.md`, `COMMAND_LOG.md`,
  `QA_CHECKLIST.md`, and `HOSTING_PORTFOLIO_ROADMAP.md`.
- Added `.gitleaks.toml`.
- Rewrote the Quick Start authenticated curl example to use a local `TOKEN`
  variable instead of a bearer-token placeholder.
- Ran Gitleaks `8.30.1` against the current tree with no leaks found.
- Ran Gitleaks `8.30.1` against full Git history with no leaks found.
- Reviewed stale public-facing docs for Supabase, single-tenant, and Android
  build-history language.
- Marked historical appendix and Android troubleshooting docs as historical.
- Updated the SaaS requirements reference stack to managed Postgres,
  S3-compatible storage, React Native/Expo, and CSV/webhook ingestion.
- Added current setup note to the VS Code setup guide.
- Added `APP_ENV=demo` hosted POC config validation so storage, SMTP, and
  Stripe can be deferred without weakening full production settings.
- Added `server/.env.demo.example`.

Remaining:

- Confirm no generated mobile build artifacts appear after the next local build.
- Commit the deployment decision that selects Neon plus Cloudflare-aligned
  infrastructure and records storage/email/Stripe deferral tradeoffs.

### Phase 2 - Hosted Backend POC

Status: in progress

Completed:

- Confirmed Neon project `techsync-poc` exists in AWS US East 1 (N. Virginia).
- Confirmed Neon branch `production` and database `neondb` are the current demo
  database target.
- Copied and distinguished the direct Neon URL for migrations from the pooled
  Neon URL for hosted app runtime.
- Reset the Neon database password after a connection string was visible during
  setup, then continued with the rotated credentials.
- Ran `alembic upgrade head` against the Neon demo database using the direct
  connection string.
- Confirmed `alembic current` reports `0001 (head)`.
- Cleared `DATABASE_URL` from the local PowerShell session after migration.

Next:

- Choose hosting provider: Vercel for portfolio alignment, or Render/Railway
  for a more traditional FastAPI service.
- Use the pooled Neon connection string for hosted/serverless runtime.
- Use `APP_ENV=demo` for the first hosted POC while storage/email/Stripe are
  deferred.
- Configure host secrets.
- Deploy FastAPI behind HTTPS.
- Smoke-test `/health`, auth, onboarding, work-order lifecycle, ingestion, and
  dashboard metrics.

### Phase 3 - Hosted Client or Demo Surface

Status: not started

Next:

- Decide whether public demo is Expo web, hosted app preview, screenshots,
  recorded walkthrough, or a lightweight portfolio wrapper.
- Configure `EXPO_PUBLIC_API_BASE_URL`.
- Validate synthetic demo flow against hosted backend.

### Phase 4 - Portfolio Integration

Status: not started

Next:

- Add TechSync to the portfolio as a field-service SaaS POC.
- Use synthetic screenshots only.
- Link the GitHub repo and hosted demo/walkthrough.
- Label production limitations honestly.

### Phase 5 - Demo QA and Evidence Pack

Status: not started

Next:

- Run backend tests.
- Run client tests.
- Run hosted smoke tests.
- Capture screenshots and evidence notes.
- Document known limitations.

### Phase 6 - Investor-Safe Stop Point

Status: not started

Stop when:

- Repo is clean and safe.
- Hosted backend works over HTTPS.
- Synthetic demo surface is linked from portfolio.
- CI passes.
- Core user journey has smoke-test evidence.
- Production limitations are documented.

## Current Recommended Next Move

Commit the Neon migration checkpoint, then choose whether FastAPI lands first
on Vercel or a traditional service host such as Render/Railway.
