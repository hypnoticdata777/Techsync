# TechSync Ops v1.2 Evidence Template

Date:
Deployment URL:
Portfolio URL:
Commit:
CI run:

## Hosted Backend

- [ ] `/health` returns `{"status":"ok","service":"techsync-ops-api"}`.
- [ ] Vercel environment uses `APP_ENV=demo`.
- [ ] Vercel `DATABASE_URL` uses the Neon pooled runtime URL.
- [ ] No secrets are present in repo, screenshots, logs, or portfolio copy.

## Smoke Test Evidence

Command:

```powershell
python scripts/smoke_v12.py --base-url "https://<vercel-url>" --output "v12-smoke-evidence.json"
```

Result:

```text
SMOKE PASSED:
```

Attach or summarize the sanitized evidence JSON. Do not include bearer tokens,
passwords, or raw environment variables.

## Required v1.2 Checks

- [ ] Organization onboarding
- [ ] Admin login
- [ ] Token refresh
- [ ] Technician creation
- [ ] Work-order creation
- [ ] Manual assignment
- [ ] Technician queue
- [ ] Status transition to in progress
- [ ] Status transition to completed
- [ ] Attachment metadata/proof boundary
- [ ] Audit events
- [ ] CSV ingestion with synthetic data
- [ ] Dashboard metrics

## Portfolio Evidence

- [ ] TechSync Ops project/case-study shell exists.
- [ ] Problem statement is visible.
- [ ] Architecture/proof summary is visible.
- [ ] GitHub repo is linked.
- [ ] Hosted demo/API/walkthrough is linked only after smoke testing passes.
- [ ] POC status and limitations are visible.
- [ ] Screenshots or walkthrough use synthetic data only.

## Known v1.2 Limitations To State Publicly

- Public POC, not real-customer production.
- Vercel Python runtime is Beta.
- Email delivery can be logged/deferred in `APP_ENV=demo`.
- Object storage can be deferred unless attachment upload is shown live.
- Stripe is deferred unless test-mode billing is explicitly enabled.
- Offline sync, push notifications, full client portal, closeout packages, and
  first-class property/client/vendor records are tracked for later versions.
