# TechSync Ops Vercel Deployment Runbook

Date: July 29, 2026

## Purpose

This runbook supports the active Vercel staging loop. The goal is a real URL
for fast product testing while keeping the environment investor-safe:
`APP_ENV=demo`, Neon Postgres, Vercel/GitHub secret storage, HTTPS-only public
URLs, and synthetic data only. Portfolio promotion is still a separate decision
after the staged walkthrough and smoke evidence are clean.

Official docs checked:

- Vercel FastAPI guide: https://vercel.com/docs/frameworks/backend/fastapi
- Vercel Python runtime: https://vercel.com/docs/functions/runtimes/python
- Vercel Git deployments: https://vercel.com/docs/git
- Neon connection pooling: https://neon.com/docs/connect/connection-pooling

Important Vercel notes:

- Vercel supports FastAPI through the Python runtime when a Python entrypoint
  exports an ASGI `app`.
- The Python runtime is marked Beta by Vercel, so the staging loop must include
  real hosted smoke tests before the portfolio link is promoted.
- Runtime dependencies are installed from root-level dependency files, so this
  repo has a root `requirements.txt` that points to `server/requirements.txt`.

## Files Added For Vercel

- `api/index.py` exposes the existing FastAPI app to Vercel.
- `requirements.txt` delegates runtime dependencies to `server/requirements.txt`.
- `.python-version` pins the Vercel Python runtime to `3.12`.
- `vercel.json` rewrites all requests to the FastAPI entrypoint and excludes
  client/tests/scanner artifacts from the Python function bundle.
- `client/vercel.json` deploys Expo web as a static `dist` build with SPA
  rewrites.
- `HOSTED_TESTING.md` is the short live-testing setup guide.
- `.github/workflows/reset-hosted-demo.yml` lets GitHub Actions migrate and
  reseed the synthetic Neon demo tenant without using local terminal secrets.

## Vercel Project Settings

Recommended API project shape:

```text
Project: techsync-ops-api
Framework preset: Other
Root directory: repository root
Build command: none
Output directory: none
Install command: default / pip from requirements.txt
```

If Vercel asks for commands, keep them minimal:

```text
Build Command: None
Development Command: None
Install Command: python -m pip install -r requirements.txt
```

Recommended web project shape:

```text
Project: techsync-ops-web
Framework preset: Other / static
Root directory: client
Build command: npm run build:web
Output directory: dist
Install command: npm ci
```

## Required Environment Variables

Set these in the API Vercel project for Preview and Production:

```text
APP_ENV=demo
DATABASE_URL=<Neon pooled connection string>
JWT_SECRET_KEY=<new generated secret, never committed>
CORS_ORIGINS=https://<web-project-url>,https://<portfolio-url-if-linked>
APP_BASE_URL=https://<web-project-url>
STRIPE_SUCCESS_URL=https://<web-project-url>/billing/success
STRIPE_CANCEL_URL=https://<web-project-url>/billing/cancel
EMAIL_DELIVERY_METHOD=log
RATE_LIMIT_TRUST_PROXY_HEADERS=true
LOG_FORMAT=json
```

Set this in the web Vercel project:

```text
EXPO_PUBLIC_API_BASE_URL=https://<api-project-url>
```

Do not paste database URLs, JWT secrets, SMTP keys, storage keys, or Stripe
keys into chat, screenshots, commits, docs, or the web project. Browser-exposed
`EXPO_PUBLIC_*` values are not secret.

Optional, only when enabled:

```text
STORAGE_BUCKET=<r2-or-s3-bucket>
STORAGE_REGION=auto
STORAGE_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=<storage access key>
STORAGE_SECRET_ACCESS_KEY=<storage secret key>
STORAGE_PUBLIC_BASE_URL=https://<public-files-domain-or-path>
STRIPE_SECRET_KEY=<stripe test secret>
STRIPE_PRICE_ID=<stripe test price>
STRIPE_WEBHOOK_SECRET=<stripe webhook signing secret>
```

## Pre-Deploy Checklist

- [ ] Neon migration is current: `alembic current` reports `0008 (head)` or
      later.
- [ ] GitHub repository secrets exist for `TECHSYNC_NEON_DIRECT_URL`,
      `TECHSYNC_HOSTED_DEMO_JWT_SECRET`, and `TECHSYNC_DEMO_PASSWORD`.
- [ ] Synthetic demo tenant can be reset with the `Reset hosted demo data`
      GitHub Actions workflow.
- [ ] `DATABASE_URL` in Vercel uses the Neon pooled runtime URL, not the direct
      migration URL.
- [ ] `JWT_SECRET_KEY` is newly generated for Vercel.
- [ ] `CORS_ORIGINS` contains only HTTPS public/demo origins, no localhost.
- [ ] `APP_ENV=demo` is set for the investor POC.
- [ ] `EXPO_PUBLIC_API_BASE_URL` in the web project points at the API project.
- [ ] No `.env` files are committed.
- [ ] Portfolio link promotion waits until staged smoke and role walkthrough
      evidence are clean.

## Smoke Test After Deploy

Replace `<api-project-url>` with the Vercel API deployment URL:

```powershell
Invoke-RestMethod "https://<api-project-url>/health"
```

Expected:

```json
{"status":"ok","service":"techsync-ops-api"}
```

Then verify:

- organization onboarding
- login and refresh
- technician creation
- work-order creation
- assignment/manual reassignment
- technician queue
- status transition
- client/property/vendor links
- duplicate-warning preflight
- internal versus client-visible messages
- approval request state
- proof-gated closeout
- closeout package and printable export
- dashboard metrics, operations report, and operations report CSV export
- dispatch board summary, unassigned queue, technician lanes, and SLA risk
- dispatch board CSV export
- tenant JSON export without password hashes, API keys, Stripe provider IDs,
  token hashes, or attachment storage paths
- CSV ingestion with synthetic data
- attachment metadata/proof boundary
- attachment upload if storage is configured

The repeatable smoke-test script covers the synthetic hosted journey and writes
a sanitized evidence file:

```powershell
python scripts/smoke_v13.py --base-url "https://<api-project-url>" --output "v13-smoke-evidence.json"
```

`v12-smoke-evidence*.json` and `v13-smoke-evidence*.json` are ignored by Git because they are local deployment
evidence, not source code.

Use `V13_EVIDENCE_TEMPLATE.md` to capture portfolio-safe proof, then wire the
public copy from `PORTFOLIO_TECHSYNC_OPS.md` into the portfolio page after the
staging URL is clean enough to promote.

You can also run the same script from GitHub Actions:

1. Go to Actions.
2. Select `Hosted v1.3 smoke test`.
3. Click `Run workflow`.
4. Paste the hosted Vercel API base URL.
5. Download the `v13-smoke-evidence` artifact after it passes.

## Known Hosting Limits

- Vercel Python runtime is Beta.
- This deployment is a public POC, not a real-customer production system.
- `APP_ENV=demo` intentionally allows email, storage, and Stripe to stay
  deferred unless explicitly configured.
- Background jobs, scheduled SLA checks, and long-running processing should be
  handled in a later architecture pass.
