# TechSync Hosting and Portfolio Roadmap

This file tracks the path from code POC to hosted, portfolio-connected,
investor-safe public POC.

## Target End State

TechSync should end this phase as:

```text
A hosted, portfolio-connected, investor-safe field-service SaaS POC.
```

That means:

- controlled hosted backend;
- synthetic/demo data only;
- portfolio case-study entry;
- repo safe for public viewing;
- CI passing;
- core user journey smoke-tested;
- production limitations clear.

## Hosting Decision

Backend candidates:

- Render
- Railway
- Fly.io
- Other managed Docker/FastAPI-friendly host

Database candidates:

- Neon Postgres
- Render Postgres
- Railway Postgres
- Fly Postgres

Object storage candidates:

- Cloudflare R2
- AWS S3
- Other S3-compatible bucket

Email candidates:

- Resend SMTP/API
- SendGrid SMTP
- Postmark SMTP
- Mailgun SMTP

Decision needed:

- Which backend host will run FastAPI?
- Which Postgres provider will hold synthetic/demo data?
- Will attachment upload be part of the first hosted POC, or deferred?
- Will Stripe test-mode checkout be part of the first hosted POC, or deferred?

## Phase 2 - Hosted Backend Setup

Tasks:

- Choose backend host.
- Create managed Postgres demo database.
- Configure host secrets:
  - `APP_ENV=production`
  - `DATABASE_URL`
  - `JWT_SECRET_KEY`
  - `CORS_ORIGINS`
  - `APP_BASE_URL`
  - email settings
  - storage settings if attachments are enabled
  - Stripe settings if billing demo is enabled
- Run Alembic migrations.
- Deploy backend behind HTTPS.
- Verify `/health`.
- Verify startup logs for missing config.

Exit criteria:

- Backend is live over HTTPS.
- Database connection works.
- Production config validation passes.
- No secrets are committed.

## Phase 3 - Demo Surface

Tasks:

- Choose demo surface:
  - Expo web preview
  - hosted mobile-style web route
  - screenshot walkthrough
  - short recording
  - portfolio wrapper
- Point demo client to hosted backend.
- Use synthetic organization, users, technicians, work orders, and attachments.
- Validate onboarding and core work-order flow.

Exit criteria:

- A portfolio viewer can understand the product without private setup.
- Demo does not expose real data.

## Phase 4 - Portfolio Integration

Tasks:

- Add TechSync to the portfolio.
- Include:
  - problem solved;
  - what the POC proves;
  - tech stack;
  - demo or walkthrough link;
  - GitHub link;
  - POC status;
  - next production work.
- Use synthetic screenshots only.

Recommended positioning:

```text
TechSync is a field-service SaaS POC proving multi-tenant work-order intake,
technician assignment, mobile execution, billing boundaries, attachments, and
tenant-safe backend architecture. It is public-demo ready, with production
security and real-customer deployment work explicitly tracked.
```

Exit criteria:

- Portfolio link works.
- Public viewer sees accurate POC claims.
- Next production steps are visible.

## Phase 5 - Evidence Pack

Tasks:

- Capture GitHub Actions CI status.
- Capture hosted `/health` result.
- Capture screenshots of:
  - onboarding;
  - login;
  - work-order list;
  - work-order detail;
  - assignment/status transition;
  - dashboard metrics;
  - ingestion result if enabled.
- Record known limitations.

Exit criteria:

- The project is showable without relying on memory or verbal explanation.
