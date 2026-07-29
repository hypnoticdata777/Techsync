# TechSync Ops Vercel Deployment Runbook

Date: July 28, 2026

## Purpose

This runbook prepares the v1.2 hosted backend checkpoint on Vercel. It keeps
the codebase investor-safe by using `APP_ENV=demo`, Neon pooled Postgres, host
secret storage, HTTPS-only public URLs, and synthetic data only.

Official docs checked:

- Vercel FastAPI guide: https://vercel.com/docs/frameworks/backend/fastapi
- Vercel Python runtime: https://vercel.com/docs/functions/runtimes/python

Important Vercel notes:

- Vercel supports FastAPI through the Python runtime when a Python entrypoint
  exports an ASGI `app`.
- The Python runtime is marked Beta by Vercel, so v1.2 must include a real
  hosted smoke test before the portfolio link is promoted.
- Runtime dependencies are installed from root-level dependency files, so this
  repo has a root `requirements.txt` that points to `server/requirements.txt`.

## Files Added For Vercel

- `api/index.py` exposes the existing FastAPI app to Vercel.
- `requirements.txt` delegates runtime dependencies to `server/requirements.txt`.
- `.python-version` pins the Vercel Python runtime to `3.12`.
- `vercel.json` rewrites all requests to the FastAPI entrypoint and excludes
  client/tests/scanner artifacts from the Python function bundle.

## Vercel Project Settings

Recommended project shape:

```text
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

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables for Production
and Preview if you want previews to boot:

```text
APP_ENV=demo
DATABASE_URL=<Neon pooled connection string>
JWT_SECRET_KEY=<new generated secret, never committed>
CORS_ORIGINS=https://<portfolio-or-demo-domain>
APP_BASE_URL=https://<portfolio-or-demo-domain>
STRIPE_SUCCESS_URL=https://<portfolio-or-demo-domain>/billing/success
STRIPE_CANCEL_URL=https://<portfolio-or-demo-domain>/billing/cancel
EMAIL_DELIVERY_METHOD=log
RATE_LIMIT_TRUST_PROXY_HEADERS=true
LOG_FORMAT=json
```

Do not paste these secrets into chat, screenshots, commits, or docs. Store them
only in Vercel.

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

- [ ] Neon migration is current: `alembic current` reports `0001 (head)` or
      later.
- [ ] `DATABASE_URL` in Vercel uses the Neon pooled runtime URL, not the direct
      migration URL.
- [ ] `JWT_SECRET_KEY` is newly generated for Vercel.
- [ ] `CORS_ORIGINS` contains only HTTPS public/demo origins, no localhost.
- [ ] `APP_ENV=demo` is set for the investor POC.
- [ ] No `.env` files are committed.
- [ ] Portfolio/demo URL decision is documented before public linking.

## Smoke Test After Deploy

Replace `<vercel-url>` with the Vercel deployment URL:

```powershell
Invoke-RestMethod "https://<vercel-url>/health"
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
- CSV ingestion with synthetic data
- dashboard metrics
- attachment metadata/proof boundary
- attachment upload if storage is configured

The repeatable smoke-test script covers the synthetic hosted journey and writes
a sanitized evidence file:

```powershell
python scripts/smoke_v12.py --base-url "https://<vercel-url>" --output "v12-smoke-evidence.json"
```

`v12-smoke-evidence*.json` is ignored by Git because it is local deployment
evidence, not source code.

Use `V12_EVIDENCE_TEMPLATE.md` to capture the final portfolio-safe v1.2 proof,
then wire the public copy from `PORTFOLIO_TECHSYNC_OPS.md` into the portfolio
page.

You can also run the same script from GitHub Actions:

1. Go to Actions.
2. Select `Hosted v1.2 smoke test`.
3. Click `Run workflow`.
4. Paste the hosted Vercel API base URL.
5. Download the `v12-smoke-evidence` artifact after it passes.

## Known v1.2 Hosting Limits

- Vercel Python runtime is Beta.
- This deployment is a public POC, not a real-customer production system.
- `APP_ENV=demo` intentionally allows email, storage, and Stripe to stay
  deferred unless explicitly configured.
- Background jobs, scheduled SLA checks, and long-running processing should be
  handled in a later architecture pass.
