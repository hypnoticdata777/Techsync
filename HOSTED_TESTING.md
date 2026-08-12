# TechSync Ops Hosted Testing Loop

This is the fast live-testing path. Use it when product maturity needs a real
URL instead of local terminal choreography.

## Recommended Loop

Use two Vercel projects connected to the same GitHub repository:

1. `techsync-ops-api`
   - Root directory: repo root
   - Framework preset: Other / FastAPI
   - Entrypoint: `api/index.py`
   - Runtime dependencies: root `requirements.txt`

2. `techsync-ops-web`
   - Root directory: `client`
   - Build command: `npm run build:web`
   - Output directory: `dist`
   - Environment variable: `EXPO_PUBLIC_API_BASE_URL=https://<api-project-url>`

Every push gives a live deployment URL. Pull requests give preview URLs. The
portfolio should link only to the stable web URL after the staging walkthrough
passes.

## Why This Path

- Vercel aligns with the portfolio path.
- Vercel's Git integration gives push-to-preview deployments.
- The existing repo already has a FastAPI Vercel adapter.
- Neon remains the managed Postgres database.
- The frontend is deployed as a static Expo web build and points at the hosted
  API through `EXPO_PUBLIC_API_BASE_URL`.

## Required API Environment Variables

Set these on the API Vercel project for Preview and Production:

```text
APP_ENV=demo
DATABASE_URL=<Neon pooled/runtime URL>
JWT_SECRET_KEY=<new Vercel-only secret>
CORS_ORIGINS=https://<web-project-url>,https://<portfolio-url-if-linked>
APP_BASE_URL=https://<web-project-url>
STRIPE_SUCCESS_URL=https://<web-project-url>/billing/success
STRIPE_CANCEL_URL=https://<web-project-url>/billing/cancel
EMAIL_DELIVERY_METHOD=log
RATE_LIMIT_TRUST_PROXY_HEADERS=true
LOG_FORMAT=json
```

Set this on the Web Vercel project:

```text
EXPO_PUBLIC_API_BASE_URL=https://<api-project-url>
```

Do not put database URLs, JWT secrets, storage keys, Stripe keys, or SMTP
credentials in the web project. `EXPO_PUBLIC_*` values are visible to browsers.

## GitHub Secrets For Demo Reset

Add these repository secrets before using the `Reset hosted demo data` workflow:

```text
TECHSYNC_NEON_DIRECT_URL=<Neon direct/non-pooler migration URL>
TECHSYNC_HOSTED_DEMO_JWT_SECRET=<same value as API JWT_SECRET_KEY or another hosted-demo-only secret>
TECHSYNC_DEMO_PASSWORD=DemoPass123!
```

Run the workflow whenever the hosted demo data needs a clean reset:

1. GitHub -> Actions.
2. `Reset hosted demo data`.
3. `Run workflow`.
4. Leave strict status enabled.

The workflow applies migrations, resets only the synthetic
`techsync-ops-demo-pmc` tenant, and checks that the seeded demo is ready.

## Smoke Test

After the API deploys:

```powershell
Invoke-RestMethod "https://<api-project-url>/health"
```

Then run:

```powershell
python scripts/smoke_v13.py --base-url "https://<api-project-url>" --output "v13-smoke-evidence.json"
```

Or use the existing `Hosted v1.3 smoke test` GitHub Action.

## Fallback Hosts

Use these only if Vercel's Python/serverless runtime becomes a real blocker:

- Render: run FastAPI as a Web Service with `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Railway: run the existing server with a service process and Neon env vars.
- Fly.io: deploy the backend Docker image as an always-on service.

The frontend can still stay on Vercel or move to the portfolio host.
