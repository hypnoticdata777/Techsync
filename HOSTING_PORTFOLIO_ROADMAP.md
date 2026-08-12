# TechSync Ops Hosting and Portfolio Roadmap

This file tracks the path from code POC to hosted, portfolio-connected,
investor-safe public POC.

## Target End State

TechSync Ops should end v1.3 as:

```text
A hosted, portfolio-connected, investor-safe PMC maintenance operations POC.
```

That means:

- controlled hosted backend;
- synthetic/demo data only;
- portfolio case-study entry;
- repo safe for public viewing;
- CI passing;
- core user journey smoke-tested;
- production limitations clear.
- v1.2 product-foundation checkpoint documented.
- v1.3 PMC operations expansion and showcase path documented.

Product roadmap:

- See `PRODUCT_ROADMAP.md`.

## Hosting Decision

Current recommendation:

```text
Neon Postgres + Vercel API/Web staging + Cloudflare DNS/portfolio/R2 later
```

Rationale:

- Neon matches the current direct Postgres runtime and should use the pooled
  connection string for serverless-style hosting.
- Cloudflare is the best fit for DNS, the portfolio front door, and later R2
  attachment storage.
- Vercel is selected for the active staged demo loop because the portfolio is
  expected to land there too. Its Python runtime is beta, so the hosted API must
  be smoke-tested carefully before the portfolio promotes the live link.
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

- Neon Postgres, selected for the first hosted POC
- Render/Railway Postgres as fallback

Object storage candidates:

- Cloudflare R2, preferred when attachment upload is enabled
- Other S3-compatible bucket as fallback

Email candidates:

- Resend SMTP/API
- SendGrid SMTP
- Postmark SMTP
- Mailgun SMTP

Current decision:

- Backend/web staging host selected: Vercel.
- First hosted POC uses `APP_ENV=demo`; full `APP_ENV=production` waits until
  SMTP and object storage are configured.
- Whether attachment upload is part of the first hosted POC, or deferred.
- Whether real SMTP email is part of the first hosted POC, or deferred.
- Stripe test-mode checkout is deferred unless a later demo explicitly needs
  live billing proof.

## Phase 2 - Hosting-Ready Foundation

Tasks:

- Choose backend host.
- Prepare Vercel deployment adapter and runbook. Completed with `api/index.py`,
  root `requirements.txt`, `vercel.json`, and `VERCEL_DEPLOYMENT.md`.
- Create managed Postgres demo database. Completed with Neon project
  `techsync-poc`, branch `production`, database `neondb`.
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
- Run Alembic migrations. Completed against Neon; `alembic current` reported
  `0001 (head)` during the first pass. Latest v1.3 migrations now need
  hosted/demo verification through `0006 (head)`.
- Use Vercel staging now for faster live testing, but keep portfolio/public
  promotion gated by smoke evidence and role walkthrough quality.

Exit criteria:

- Database connection works and migrations are applied.
- Demo config validation passes locally/CI with deferred storage/email/Stripe,
  and
  production config remains strict for later real-customer readiness.
- No secrets are committed.

## Phase 3 - v1.3 Product Depth Before Hosting

Tasks:

- Build first-class client, property, and vendor workflows. Completed in the
  v1.3 API foundation and started in the mobile PMC directory.
- Link work orders to property/client/vendor context. Completed.
- Link work orders to property/client/vendor context from the mobile form.
  Completed.
- Add client-visible communication separation. Completed at API/mobile level.
- Add proof-gated closeout and manager override path. Completed.
- Add stale work, workload, and property hotspot reporting. Completed at
  API/mobile level.
- Add repeatable v1.3 hosted smoke coverage for the above. Completed with
  `scripts/smoke_v13.py`, the `Hosted v1.3 smoke test` workflow, and
  `V13_EVIDENCE_TEMPLATE.md`, now including client/property/vendor CSV export
  checks and tenant JSON export checks.
- Add repeatable synthetic demo seed/reset tooling. Completed with
  `scripts/seed_demo_data.py` and `DEMO_DATA_RUNBOOK.md`.
- Apply v1.3 migrations and run hosted smoke evidence after deployment.

Exit criteria:

- The product tells a stronger PMC operations story before any public live link.
- Demo data can show property/client/vendor workflows without manual narration.
- Staged hosting can be used during UI/UX maturity. Portfolio promotion waits
  until the staged walkthrough is clean enough to show.

## Phase 4 - Demo Surface

Tasks:

- Choose demo surface:
  - Expo web preview
  - hosted mobile-style web route
  - screenshot walkthrough
  - short recording
  - portfolio wrapper
- Point demo client to hosted backend through `EXPO_PUBLIC_API_BASE_URL`.
- Use synthetic organization, users, technicians, work orders, and attachments.
- Seed/reset the synthetic demo tenant before final screenshots or walkthrough
  recording.
- Validate onboarding and core work-order flow.

Exit criteria:

- A portfolio viewer can understand the product without private setup.
- Demo does not expose real data.

## Phase 5 - Portfolio Integration

Tasks:

- Add TechSync Ops to the portfolio.
- If the portfolio URL is not live yet, prepare the TechSync Ops project entry and
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
- Use `PORTFOLIO_TECHSYNC_OPS.md` as the source copy for the case-study page.

Recommended positioning:

```text
TechSync Ops is a PMC maintenance operations POC proving multi-tenant work-order
intake, dispatch, technician execution, proof capture, attachment handling,
reporting boundaries, and tenant-safe backend architecture. It is public-demo
ready, with production security and real-customer deployment work explicitly
tracked.
```

Exit criteria:

- Portfolio link works.
- Public viewer sees accurate POC claims.
- Next production steps are visible.

## Phase 6 - Evidence Pack

Tasks:

- Capture GitHub Actions CI status.
- Capture hosted `/health` result after each staged deploy.
- Capture synthetic demo seed/reset status output after hosted/demo database
  migration.
- Capture `scripts/smoke_v13.py` result against the staged API.
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
