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

Current recommendation:

```text
Neon Postgres + Vercel or Render/Railway FastAPI + Cloudflare DNS/portfolio/R2 later
```

Rationale:

- Neon matches the current direct Postgres runtime and should use the pooled
  connection string for serverless-style hosting.
- Cloudflare is the best fit for DNS, the portfolio front door, and later R2
  attachment storage.
- Vercel is attractive if the portfolio is also hosted there, but the Python
  runtime is beta and must be smoke-tested carefully.
- Render or Railway are lower-friction traditional FastAPI service options if
  we want fewer serverless runtime constraints.
- Cloudflare Workers Python can run FastAPI, but Python Workers are beta and
  should be treated as a later optimization, not the first investor POC host.

Detailed decision record:

- See `DEPLOYMENT_DECISION.md`.

Backend candidates:

- Vercel
- Render
- Railway

Database candidates:

- Neon Postgres
- Render/Railway Postgres as fallback

Object storage candidates:

- Cloudflare R2, preferred when attachment upload is enabled
- Other S3-compatible bucket as fallback

Email candidates:

- Resend SMTP/API
- SendGrid SMTP
- Postmark SMTP
- Mailgun SMTP

Decision needed:

- Which backend host will run FastAPI: Vercel for portfolio alignment, or
  Render/Railway for a more traditional web service.
- First hosted POC uses `APP_ENV=demo`; full `APP_ENV=production` waits until
  SMTP and object storage are configured.
- Whether attachment upload is part of the first hosted POC, or deferred.
- Whether real SMTP email is part of the first hosted POC, or deferred.
- Stripe test-mode checkout is deferred unless a later demo explicitly needs
  live billing proof.

## Phase 2 - Hosted Backend Setup

Tasks:

- Choose backend host.
- Create managed Postgres demo database.
- Configure host secrets:
  - `APP_ENV=production` for full production validation, or a documented demo
    deployment mode if storage/email/Stripe are intentionally deferred
  - `APP_ENV=demo` for the first investor-safe hosted POC while
    storage/email/Stripe are deferred
  - `DATABASE_URL`
  - `JWT_SECRET_KEY`
  - `CORS_ORIGINS`
  - `APP_BASE_URL`
  - email settings if SMTP delivery is enabled
  - storage settings if attachments are enabled
  - Stripe callback/webhook settings if billing demo is enabled
- Run Alembic migrations.
- Deploy backend behind HTTPS.
- Verify `/health`.
- Verify startup logs for missing config.

Exit criteria:

- Backend is live over HTTPS.
- Database connection works.
- Hosted demo config validation passes with deferred storage/email/Stripe, and
  production config remains strict for later real-customer readiness.
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
- If the portfolio URL is not live yet, prepare the TechSync project entry and
  connect the live link after the portfolio deployment exists.
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
