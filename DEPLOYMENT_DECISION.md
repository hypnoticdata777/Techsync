# TechSync Deployment Decision

Date: July 29, 2026

This file records the current hosting decision path for the public POC so
backend, storage, email, Stripe, and portfolio work stay aligned.

## Recommended First POC Path

Use this as the default unless a later implementation pass finds a blocker:

```text
Database: Neon Postgres, project techsync-poc, using the pooled connection string for hosted/serverless runtime
Backend: Vercel FastAPI project for active hosted staging
Cloudflare: DNS, portfolio/static front door, and later R2 object storage
Storage: deferred for the first hosted smoke test unless attachment upload is in scope
Email: deferred/logged for the first hosted smoke test; real client invite/approval evidence can be captured manually from the hosted email/log path
Stripe: deferred; document as a supported billing boundary for later test-mode enablement
Portfolio: keep the TechSync Ops project entry ready; promote the live link only after staged smoke and role walkthrough evidence are clean
```

## Why This Path

- Neon is the best fit for the current managed-Postgres architecture.
- Use Neon's pooled connection string for serverless-style hosts so short-lived
  functions do not exhaust normal Postgres connections.
- Cloudflare is a strong fit for DNS, the eventual portfolio front door, and
  R2 because the backend already targets S3-compatible attachment storage.
- Cloudflare Workers can run Python/FastAPI, but Python Workers are still beta
  and require a different deployment shape. Keep that as a later optimization,
  not the first investor POC backend.
- Vercel is selected for active hosted staging because the portfolio is
  expected to land there too. Its Python runtime is beta, so the hosted API must
  be smoke-tested carefully before the live link is promoted.
- Render or Railway remain fallback options if Vercel's Python/serverless
  constraints create blockers.

## Provider Tradeoffs

### Neon Postgres

Current POC state:

- Neon project: `techsync-poc`
- Region: AWS US East 1 (N. Virginia)
- Branch: `production`
- Database: `neondb`
- Migration status: initial hosted-readiness pass reached `0001 (head)`;
  v1.3 migrations have since been verified through `0008 (head)`.
- Direct connection string was used for Alembic migration.
- Pooled connection string is reserved for hosted app runtime.
- No Neon connection strings or secrets are tracked in this repo.

Pros:

- Managed Postgres without bringing Supabase back as a runtime dependency.
- Built-in pooling for serverless hosts.
- Good fit for SQLAlchemy, Alembic, and direct Postgres tenant-scoping tests.

Tradeoffs:

- Needs migration discipline before every hosted demo.
- Connection pooling helps serverless workloads, but long transactions and
  heavy background work still need careful design.
- Backups, branching, and retention policy need to be confirmed before real
  customer data.

### Cloudflare

Best first uses:

- DNS for the portfolio/domain.
- Cloudflare Pages or portfolio static hosting if the portfolio is moved there.
- R2 for attachment storage when attachment upload becomes part of the demo.

Tradeoffs:

- R2 adds storage keys, bucket policy, CORS/public URL decisions, and attachment
  smoke testing.
- Cloudflare Workers for the FastAPI backend would require beta Python Workers
  and a Worker-oriented app shape. This is possible, but not the lowest-risk
  first deployment path.
- Hyperdrive can improve external Postgres access from Workers, but only matters
  if the backend runs on Cloudflare Workers.

### Vercel

Pros:

- Easy to connect to a portfolio or project landing page.
- Supports FastAPI through the Python runtime.
- Good preview deployment workflow.
- Selected for active hosted staging because the portfolio path is expected to
  use Vercel.

Tradeoffs:

- Python runtime is beta.
- Serverless function limits and cold-start behavior can affect heavier API
  paths.
- Needs Neon pooled database URL, strict environment variables, and smoke tests.

### Render or Railway

Pros:

- More traditional always-on web service model for FastAPI.
- Fewer changes to the current backend shape.
- Straightforward logs and service health checks.

Tradeoffs:

- Less tightly integrated with a Vercel-hosted portfolio.
- May need separate DNS/domain setup.
- Pricing and sleep/cold-start behavior depend on chosen plan.

## Storage Decision

Default: defer object storage for the first hosted smoke test.

Defer when:

- The immediate goal is `/health`, auth, onboarding, work orders, assignment,
  CSV/webhook ingestion, and dashboard proof.
- We want fewer secrets and fewer moving parts before investor review.
- Attachment upload can be documented as implemented in code but not enabled in
  the first hosted environment.

Enable Cloudflare R2 now when:

- Attachment upload is part of the live demo.
- We need to prove RF-19 end to end with synthetic files.
- We are ready to configure `STORAGE_BUCKET`, `STORAGE_ENDPOINT_URL`,
  `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, and
  `STORAGE_PUBLIC_BASE_URL`.

Important current-code note:

- `APP_ENV=demo` now permits object storage to be deferred for the first hosted
  POC. If any storage setting is provided in demo mode, the storage settings
  must be complete.
- `APP_ENV=production` still requires object storage settings.

## Email Decision

Default: defer real SMTP for the first hosted smoke test.

Defer when:

- We can show onboarding/auth flows without relying on live email delivery.
- We want to avoid provider setup, DNS records, and deliverability work.

Enable SMTP now when:

- Invitations and password reset links must work through real inboxes.
- The investor/demo flow depends on email delivery proof.

Important current-code note:

- `APP_ENV=demo` permits `EMAIL_DELIVERY_METHOD=log` for the first hosted POC.
- `APP_ENV=production` still requires `EMAIL_DELIVERY_METHOD=smtp`,
  `EMAIL_FROM`, `SMTP_HOST`, `SMTP_USERNAME`, and `SMTP_PASSWORD`.

## Stripe Decision

Default: defer Stripe.

Document Stripe as:

- A billing boundary already represented in the product architecture.
- A later test-mode enablement task requiring Stripe keys, callback URLs, and
  a signed webhook secret.

Current-code note:

- `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` are required in production.
- `STRIPE_WEBHOOK_SECRET` is required only when `STRIPE_SECRET_KEY` or
  `STRIPE_PRICE_ID` is configured.

## Portfolio Timing

Use hosting now as a staging/test accelerator. Do wait to hardwire or promote
portfolio links until the staged API/web walkthrough is clean.

Current flow:

1. Neon demo Postgres is created and migrated through `0008 (head)`.
2. Use the pooled Neon connection string for hosted/serverless runtime.
3. Deploy the backend on Vercel for live staging and portfolio alignment.
4. Deploy Expo web as a separate Vercel project with
   `EXPO_PUBLIC_API_BASE_URL` pointing at the API project.
5. Use `APP_ENV=demo` for the first hosted environment while
   storage/email/Stripe are deferred.
6. Configure host secrets, reset the synthetic demo tenant through GitHub
   Actions, and smoke-test the backend with
   `scripts/smoke_v13.py`.
7. Add the TechSync Ops card/case study to the portfolio.
8. Promote the live TechSync Ops URL once staged evidence is clean.

## Official References Checked

- Cloudflare Python Workers: https://developers.cloudflare.com/workers/languages/python/
- Cloudflare R2: https://developers.cloudflare.com/r2/how-r2-works/
- Cloudflare R2 S3 compatibility: https://developers.cloudflare.com/r2/api/s3/api/
- Neon connection pooling: https://neon.com/docs/connect/connection-pooling
- Vercel FastAPI: https://vercel.com/docs/frameworks/backend/fastapi
- Vercel Python runtime: https://vercel.com/docs/functions/runtimes/python
