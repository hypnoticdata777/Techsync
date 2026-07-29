# TechSync Command Log

This file records meaningful commands and verification steps so future sessions
can reconstruct what happened without relying on chat history.

## 2026-07-21 - Phase 0 Repo Rehydration

Working directory:

```text
C:\Users\hypno\Documents\Codex\2026-07-21\he
```

Commands:

```powershell
git clone https://github.com/hypnoticdata777/Techsync.git work\Techsync
```

Result:

- Failed due to Windows Git SChannel credential issue:
  `SEC_E_NO_CREDENTIALS`.

Retry:

```powershell
git -c http.sslBackend=openssl clone https://github.com/hypnoticdata777/Techsync.git work\Techsync
```

Result:

- Clone succeeded.

Verification:

```powershell
git status --short --branch
git remote -v
git log --oneline --decorate -n 12
```

Result:

- `main` aligned with `origin/main`.
- Remote set to `https://github.com/hypnoticdata777/Techsync.git`.
- `HEAD` at `3c3f0ac Document secret history scan`.

CI verification:

```powershell
python -c "import json, urllib.request; url='https://api.github.com/repos/hypnoticdata777/Techsync/actions/runs?per_page=5'; req=urllib.request.Request(url, headers={'User-Agent':'Codex','Accept':'application/vnd.github+json'}); data=json.load(urllib.request.urlopen(req, timeout=20)); [print(run.get('name'), run.get('head_branch'), run.get('head_sha')[:7], run.get('status'), run.get('conclusion'), run.get('created_at'), run.get('html_url')) for run in data.get('workflow_runs', [])]"
```

Result:

- Latest `CI` run on `main` for `3c3f0ac` completed with `success`.

## 2026-07-21 - Provider Decision Research

Official docs reviewed:

- Cloudflare Python Workers:
  `https://developers.cloudflare.com/workers/languages/python/`
- Cloudflare R2:
  `https://developers.cloudflare.com/r2/how-r2-works/`
- Cloudflare R2 S3 compatibility:
  `https://developers.cloudflare.com/r2/api/s3/api/`
- Neon connection pooling:
  `https://neon.com/docs/connect/connection-pooling`
- Vercel FastAPI:
  `https://vercel.com/docs/frameworks/backend/fastapi`
- Vercel Python runtime:
  `https://vercel.com/docs/functions/runtimes/python`

Result:

- Neon is the recommended Postgres provider for the first hosted POC.
- Use Neon's pooled connection string when deploying to serverless-style hosts.
- Cloudflare is recommended for DNS/portfolio front door and later R2
  attachment storage.
- Cloudflare Python Workers can support Python/FastAPI, but Python Workers are
  beta and should not be the first backend deployment target for this POC.
- Vercel can host FastAPI, but its Python runtime is beta; choose it if
  portfolio alignment matters more than traditional service hosting.
- Render/Railway remain strong fallback options for a traditional FastAPI
  service.
- Stripe is deferred for the first investor POC.
- Email and storage can be deferred only if the first hosted environment is
  documented as demo mode or the production config is adjusted; current
  `APP_ENV=production` validation requires SMTP and object storage settings.

## 2026-07-23 - Hosted Demo Config Mode

Files changed:

- `server/core/config.py`
- `server/tests/test_config.py`
- `server/.env.demo.example`
- `README.md`
- `QUICKSTART.md`
- `DEPLOYMENT_DECISION.md`
- `HOSTING_PORTFOLIO_ROADMAP.md`
- `PHASE_STATUS.md`
- `PUBLIC_POC_READINESS.md`
- `QA_CHECKLIST.md`
- `PRE_LAUNCH_CHECKLIST.md`
- `BUILD_LOG.md`

Result:

- `APP_ENV=demo` is now the first hosted POC lane.
- Demo mode validates hosted basics: `DATABASE_URL`, `JWT_SECRET_KEY`,
  `CORS_ORIGINS`, `APP_BASE_URL`, `STRIPE_SUCCESS_URL`, and
  `STRIPE_CANCEL_URL`.
- Demo mode rejects localhost CORS and non-HTTPS public URLs.
- Demo mode allows SMTP, object storage, and Stripe keys to remain empty.
- Production mode still requires SMTP and object storage settings.

Verification:

```powershell
python -m compileall core tests\test_config.py
tools\gitleaks-8.30.1\gitleaks.exe dir --config .gitleaks.toml --verbose --redact --report-format json --report-path gitleaks-dir-report.json .
git diff --check
```

Result:

- Python compile check passed for `server/core` and `server/tests/test_config.py`.
- Direct config import checks passed for the intended demo-mode success case.
- Direct config import checks passed for the intended full-production success
  case when SMTP and storage settings are complete.
- Direct config import checks failed as expected for localhost CORS, partial
  storage config, and incomplete production config.
- Gitleaks current-tree scan found no leaks.
- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.
- `pytest` was not available in the local system or bundled Python runtime, so
  the pytest suite was not run in this environment.

## 2026-07-23 - Neon Demo Database Migration

Context:

- Neon project: `techsync-poc`
- Region: AWS US East 1 (N. Virginia)
- Branch: `production`
- Database: `neondb`
- Direct connection string used for migration.
- Pooled connection string reserved for hosted app runtime.

Secret handling:

- A Neon connection string became visible during setup, so the database password
  was reset before continuing.
- No connection strings or credentials were written to repo files.
- `DATABASE_URL` was loaded into the local PowerShell session only for the
  migration.
- `DATABASE_URL` was removed from the local PowerShell session after migration.

Commands:

```powershell
python -m venv venv
venv\Scripts\activate.bat
python -m pip install -r requirements.txt
powershell
$env:DATABASE_URL = (Get-Clipboard).Trim()
$env:DATABASE_URL.StartsWith("postgresql://")
$env:DATABASE_URL.Contains("-pooler")
alembic upgrade head
alembic current
Remove-Item Env:DATABASE_URL
```

Result:

- `alembic upgrade head` applied the initial multi-tenant schema migration.
- `alembic current` reported `0001 (head)`.
- Neon now has the TechSync POC schema applied.

Documentation verification:

```powershell
git diff --check
rg -n -i "postgresql://|neondb_owner|DATABASE_URL=.*@|password=|npg_|sk_live_|sk_test_|whsec_|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY" BUILD_LOG.md COMMAND_LOG.md DEPLOYMENT_DECISION.md HOSTING_PORTFOLIO_ROADMAP.md PHASE_STATUS.md PUBLIC_POC_READINESS.md QA_CHECKLIST.md
```

Result:

- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.
- Focused secret scan found no real Neon connection string, Neon password,
  private key, or live service key in the migration checkpoint docs.
- Matches were limited to placeholder/test values or literal verification
  commands.

## 2026-07-21 - Phase 1 Initial Safety Sweep

Commands:

```powershell
git ls-files
Get-Content .gitignore
Get-ChildItem -Force -Recurse -File -Include *.env*,*.pem,*.key,*.p12,*.sqlite,*.db,*.pdf,*.csv,*.zip
git ls-files | rg -n "(__pycache__|\.pyc$|\.env$|\.db$|\.sqlite$|\.pdf$|\.csv$|\.zip$|\.p12$|\.key$|\.pem$|\.apk$|\.aab$)"
git ls-files | rg -n "debug\.keystore|keystore|jks"
```

Result:

- Only `server/.env.example` appeared in the env-file scan.
- No tracked `.env`, DB, SQLite, PDF, CSV, zip, APK, AAB, private key, or
  production key file was found.
- Two tracked Python bytecode files were found under `server/__pycache__`.
- `client/android/app/debug.keystore` is tracked; this is the normal Android
  debug keystore pattern and must not be used as a production signing key.

Secret-pattern scan:

```powershell
rg -n -i "(password123|admin@techsync|tech@techsync|sk_live_|sk_test_|whsec_|AKIA[0-9A-Z]{16}|aws_access_key_id|aws_secret_access_key|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY|service[-_ ]role|supabase\.co|postgres(ql)?://[^\s]+:[^\s]+@|JWT_SECRET_KEY\s*=\s*[^\s#]+|SMTP_PASSWORD\s*=\s*[^\s#]+|STORAGE_SECRET_ACCESS_KEY\s*=\s*[^\s#]+)" .
```

Result:

- Matches were placeholder/docs/test values, not live secrets.
- Examples included placeholder Postgres URLs, placeholder JWT/storage/SMTP
  values, Stripe webhook placeholders, and test-only `whsec_test` values.

Cleanup:

```powershell
git rm server\__pycache__\main.cpython-313.pyc server\__pycache__\supabase_client.cpython-313.pyc
```

Result:

- Removed tracked generated bytecode files from the public POC repo.

Final staged status:

```powershell
git status --short --branch
git diff --cached --stat
git diff --cached --check
```

Result:

- `main` still aligned with `origin/main`.
- Staged changes are documentation plus bytecode cleanup.
- `git diff --cached --check` passed.

## 2026-07-21 - Independent Gitleaks Scan

Downloaded scanner:

```text
C:\Users\hypno\OneDrive\Desktop\gitleaks_8.30.1_windows_x32.zip
```

Extraction:

```powershell
Expand-Archive -LiteralPath "C:\Users\hypno\OneDrive\Desktop\gitleaks_8.30.1_windows_x32.zip" -DestinationPath "tools\gitleaks-8.30.1" -Force
tools\gitleaks-8.30.1\gitleaks.exe version
```

Result:

- Gitleaks version `8.30.1`.

Initial unconfigured history scan:

```powershell
tools\gitleaks-8.30.1\gitleaks.exe git --verbose --redact --report-format json --report-path gitleaks-report.json .
```

Result:

- One finding in historical `QUICKSTART.md` docs: `curl-auth-header` on an
  example bearer-token placeholder.

Initial unconfigured current-tree scan:

```powershell
tools\gitleaks-8.30.1\gitleaks.exe dir --verbose --redact --report-format json --report-path gitleaks-dir-report.json .
```

Result:

- One finding in current `QUICKSTART.md` docs: `curl-auth-header` on
  `Bearer YOUR_ACCESS_TOKEN`.
- Two findings inside the downloaded Gitleaks README because the scanner tool
  was extracted under the repo working folder.

Remediation:

- Added `.gitleaks.toml` to allowlist the documented localhost curl placeholder
  pattern.
- Updated `QUICKSTART.md` to use `TOKEN="PASTE_RETURNED_ACCESS_TOKEN_HERE"` and
  `Authorization: Bearer ${TOKEN}`.
- Updated `.gitignore` so local scanner binaries and generated redacted reports
  are not committed.

Configured current-tree scan:

```powershell
tools\gitleaks-8.30.1\gitleaks.exe dir --config .gitleaks.toml --verbose --redact --report-format json --report-path gitleaks-dir-report.json .
```

Result:

- No leaks found.

Configured full-history scan:

```powershell
tools\gitleaks-8.30.1\gitleaks.exe git --config .gitleaks.toml --verbose --redact --report-format json --report-path gitleaks-report.json .
```

Result:

- No leaks found across 38 commits.

## 2026-07-21 - Stale Public-Docs Review

Scan command:

```powershell
rg -n -i "supabase|single-tenant|single tenant|AsyncStorage|demo credentials|admin@techsync|tech@techsync|password123|React Native 0\.72|React Native \(CLI|Make\.com|outside of Supabase|server/supabase_client" -g "*.md" .
```

Result:

- Active docs already identified the current direct Postgres runtime in README
  and pre-launch checklist.
- `APPENDIX_TECHNICAL_OVERVIEW.md` still contained historical Supabase,
  AsyncStorage, and single-tenant architecture references.
- The then-current SaaS requirements document still listed Supabase and React
  Native CLI in the reference stack. It has since been replaced by
  `TECHSYNC_OPS_REQUIREMENTS.md`.
- Android build-recovery docs contained useful but old version-specific guidance.

Changes:

- Added a current public POC architecture note to the technical appendix.
- Marked historical appendix sections explicitly.
- Updated the SaaS requirements reference stack to React Native/Expo, managed
  Postgres via SQLAlchemy/psycopg2, S3-compatible attachment storage, and
  CSV/webhook ingestion with PDF/email/forms deferred.
- Updated RF-05 and RNF-11 to remove the outdated Supabase runtime assumption.
- Added a current setup note to `VSCODE_SETUP_GUIDE.md`.
- Added historical troubleshooting notes to Android/Windows build docs.

Verification:

```powershell
rg -n -i "supabase|single-tenant|single tenant|AsyncStorage|demo credentials|admin@techsync|tech@techsync|password123|React Native 0\.72|React Native \(CLI|Make\.com|outside of Supabase|server/supabase_client" -g "*.md" .
```

Result:

- Remaining matches are either active docs saying Supabase is not the runtime
  dependency, explicit historical labels, test/example values, or tracker
  evidence.

## 2026-07-28 - v1.3 PMC Foundation and Hosting Deferral

Decision:

- Vercel remains the selected showcase host, but public deployment and portfolio
  hard-linking are deferred to the end of v1.3 so TechSync Ops can become more
  robust before it is promoted.

Changes:

- Added Alembic migration `0002_pmc_entities.py` for clients, properties,
  vendors, expanded user/invitation roles, and work-order links.
- Added tenant-scoped client, property, and vendor API models, repositories, and
  routers.
- Updated work orders so they can reference property, client, and vendor records
  while keeping the legacy customer/address fields.
- Updated the base SQL schema to match the v1.3 PMC entity model.
- Updated roadmap, traceability, QA, hosting, Vercel, pre-launch, requirements,
  and public-readiness docs so Vercel/portfolio hosting sits at the
  end-of-v1.3 showcase gate.

Verification:

```powershell
python -m compileall -q server\alembic\versions\0001_initial_schema.py server\alembic\versions\0002_pmc_entities.py server\main.py server\models server\repositories server\routers server\tests
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- `git diff --check` passed.
- Local pytest could not run because neither `server\venv` nor system Python has
  pytest installed in this checkout.

## 2026-07-28 - v1.3 Work-Order Communication Separation

Decision:

- Add backend support for client-visible communication without exposing internal
  operational notes.

Changes:

- Added Alembic migration `0003_work_order_messages.py`.
- Added `work_order_messages` schema with `internal` versus `client`
  visibility.
- Added `WorkOrderMessage` schemas and tenant-scoped message repository.
- Added work-order message endpoints:
  - `POST /work-orders/{work_order_id}/messages`
  - `GET /work-orders/{work_order_id}/messages`
- Client/viewer users are forced to client-visible messages only and are
  matched to a work order through the work order's client email.
- Internal roles can filter messages by visibility for operations review.
- Updated roadmap, traceability, requirements, QA, and phase-status docs.

Verification:

```powershell
python -m compileall -q server\alembic\versions\0003_work_order_messages.py server\models\work_order_message.py server\repositories\work_order_messages.py server\routers\work_orders.py server\tests\test_tenant_isolation.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); from models.work_order import WorkOrder; row={'id':1,'organization_id':1,'title':'Test','service_type':'general','priority':'medium','status':'open','source':'manual','created_at':'2026-07-28T00:00:00Z','updated_at':'2026-07-28T00:00:00Z','client_approval_status':'pending'}; print(WorkOrder(**row).client_approval_status)"
git diff --check
server\venv\Scripts\python.exe -m pytest server\tests\test_tenant_isolation.py -p no:cacheprovider
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- WorkOrder model smoke parsed `client_approval_status` and printed `pending`.
- `git diff --check` passed.
- Local pytest could not run because `server\venv` does not have pytest
  installed.

## 2026-07-28 - v1.3 Closeout Package Summary

Decision:

- Add a structured closeout package summary before PDF/export generation so the
  API can already show completion status, proof, attachments, communication,
  and audit context.

Changes:

- Added `WorkOrderCloseoutPackage` response model.
- Added `GET /work-orders/{work_order_id}/closeout-package`.
- The closeout summary includes:
  - work order status and completion metadata;
  - proof status: `verified`, `override`, or `missing`;
  - attachment/proof records;
  - client-visible messages;
  - internal messages;
  - audit events.
- Added regression coverage for closeout package composition and tenant-scoped
  repository calls.
- Updated roadmap, traceability, requirements, QA, and phase-status docs while
  keeping PDF/export generation deferred.

Verification:

```powershell
python -m compileall -q server\models\closeout_package.py server\routers\work_orders.py server\tests\test_closeout_package.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
server\venv\Scripts\python.exe -m pytest server\tests\test_closeout_package.py -p no:cacheprovider
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- `git diff --check` passed.
- Local pytest could not run because `server\venv` does not have pytest
  installed.

## 2026-07-28 - v1.3 Operations Reporting

Decision:

- Add backend reporting that helps PMC operators spot urgent operational risk
  before public hosting: stale work, overloaded technicians, and property
  hotspots.

Changes:

- Added nested dashboard/report schemas for stale work orders, overloaded
  technicians, property hotspots, and the combined operations report.
- Added work-order repository report queries:
  - `list_stale_work_orders`
  - `list_overloaded_technicians`
  - `list_property_hotspots`
- Added `GET /dashboard/operations-report` with configurable `stale_days`,
  `hotspot_days`, and `limit` query params.
- Added tenant-scoping regression coverage for all report queries and endpoint
  composition.
- Updated roadmap, traceability, requirements, QA, and phase-status docs.

Verification:

```powershell
python -m compileall -q server\models\dashboard.py server\repositories\work_orders.py server\routers\dashboard.py server\tests\test_tenant_isolation.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
server\venv\Scripts\python.exe -m pytest server\tests\test_tenant_isolation.py -p no:cacheprovider
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- `git diff --check` passed.
- Local pytest could not run because `server\venv` does not have pytest
  installed.

## 2026-07-28 - v1.3 Mobile Operations Report View

Decision:

- Expose the new operations report backend in the mobile app for org admins and
  coordinators before public hosting, so reporting becomes visible in the demo
  surface instead of backend-only evidence.

Changes:

- Added `OperationsReportScreen` in the Expo client.
- Added operator controls for stale-work and property-hotspot time windows.
- Rendered three report buckets:
  - stale open/in-progress work orders;
  - technicians over daily capacity;
  - properties with repeated maintenance activity.
- Linked the report from the work-order list only for `org_admin` and
  `coordinator` users.
- Tightened the work-order list Add action to the same admin/coordinator roles
  that the backend create endpoint already requires.
- Updated roadmap, traceability, requirements, QA, and phase-status docs.

Verification:

```powershell
node -e "const babel=require('@babel/core'); ['App.js','src/screens/WorkOrdersListScreen.js','src/screens/OperationsReportScreen.js'].forEach(f=>babel.transformFileSync(f,{presets:['module:metro-react-native-babel-preset']})); console.log('babel ok')"
npm run test:ci -- --runTestsByPath src/utils/validation.test.js src/utils/tokenStorage.test.js
git diff --check
```

Result:

- `git diff --check` passed.
- Babel transform and focused client Jest tests could not run locally because
  `client/node_modules` is not installed in this checkout (`@babel/core` and
  `jest` were unavailable).

## 2026-07-28 - v1.3 Client-Visible Work Order Communication

Decision:

- Move the client/homeowner surface from backend-only guardrails into the mobile
  work-order detail experience while tightening client/viewer work-order
  visibility before public demo work.

Changes:

- Added active-client lookup by email in the client repository.
- Scoped `client` and `viewer` users to their matching active client record when
  listing or opening work orders.
- Kept vendor work-order access disabled until the vendor workflow is
  intentionally designed.
- Restricted status transitions and audit-event access to
  org-admin/coordinator/technician roles.
- Added mobile work-order communication timeline:
  - staff can send internal or client-visible messages;
  - client/viewer users can only send client-visible comments;
  - messages render inside work-order details.
- Hid status actions and attachment upload actions from client/viewer users in
  the mobile detail view.
- Updated roadmap, traceability, requirements, QA, and phase-status docs.

Verification:

```powershell
python -m compileall -q server\repositories\clients.py server\routers\work_orders.py server\tests\test_tenant_isolation.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
server\venv\Scripts\python.exe -m pytest server\tests\test_tenant_isolation.py -p no:cacheprovider
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- `git diff --check` passed.
- Local pytest could not run because neither `server\venv` nor system Python has
  pytest installed.

## 2026-07-28 - v1.3 Client Approval Workflow

Decision:

- Add client approval as its own work-order approval state instead of overloading
  field execution status, so client decisions can be shown without confusing
  technician workflow.

Changes:

- Added Alembic migration `0005_client_approvals.py`.
- Added `client_approval_status`, request metadata, decision metadata, and notes
  to work orders.
- Added staff `POST /work-orders/{work_order_id}/approval-request`.
- Added client `PATCH /work-orders/{work_order_id}/approval` for approved or
  declined decisions.
- Approval requests and decisions create audit events and client-visible
  timeline messages.
- Added mobile approval panel in work-order details:
  - admin/coordinator users can request or re-request approval;
  - client users can approve or decline pending approvals;
  - viewer users can observe approval status without taking action.
- Added regression coverage for linked-client requirement, pending-decision
  guardrail, and approval event/message writes.
- Updated roadmap, traceability, requirements, QA, and phase-status docs.

Verification:

```powershell
python -m compileall -q server\alembic\versions\0005_client_approvals.py server\models\work_order.py server\repositories\clients.py server\routers\work_orders.py server\tests\test_tenant_isolation.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
server\venv\Scripts\python.exe -m pytest server\tests\test_tenant_isolation.py -p no:cacheprovider
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- `git diff --check` passed.
- Local pytest could not run because `server\venv` does not have pytest
  installed.

## 2026-07-28 - v1.3 Printable Closeout Export

Decision:

- Add a real closeout export path without introducing a heavy PDF-rendering
  dependency before hosting. Printable HTML can be saved or printed as PDF by
  the browser or hosting layer, and text export provides a simple fallback.

Changes:

- Added `services/closeout_export_service.py`.
- Added `GET /work-orders/{work_order_id}/closeout-package/export`.
- Supports `format=html` and `format=text`.
- Export includes work-order summary, proof status, client approval status,
  completion notes, attachments, client messages, internal notes, and audit
  events.
- Reused the same closeout package assembly path for JSON and exports.
- Added closeout export tests for HTML/text rendering and downloadable response
  headers.
- Updated roadmap, traceability, requirements, QA, and phase-status docs.

Verification:

```powershell
python -m compileall -q server\services\closeout_export_service.py server\routers\work_orders.py server\tests\test_closeout_package.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); sys.path.insert(0, 'server/tests'); from test_closeout_package import _sample_package; from services.closeout_export_service import build_closeout_html; print('Closeout Package' in build_closeout_html(_sample_package()))"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
server\venv\Scripts\python.exe -m pytest server\tests\test_closeout_package.py -p no:cacheprovider
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- Closeout export render smoke returned `True`.
- `git diff --check` passed.
- Local pytest could not run because `server\venv` does not have pytest
  installed.

## 2026-07-28 - v1.3 Proof-Gated Closeout

Decision:

- A work order cannot be moved to `completed` unless it has attachment proof or
  an org admin/coordinator records a completion override reason.

Changes:

- Added Alembic migration `0004_completion_proof_gate.py`.
- Added `completion_proof_verified_at` and `completion_override_reason` to work
  orders.
- Added attachment proof lookup helper.
- Updated status transition service so completion:
  - succeeds automatically when proof attachments exist;
  - succeeds without proof only for `org_admin`/`coordinator` with an override
    reason;
  - fails for technician override attempts;
  - fails when no proof and no override reason are present.
- Updated status route error mapping.
- Added regression coverage for proof-required, proof-present, manager override,
  and technician override rejection paths.
- Updated roadmap, traceability, requirements, QA, and phase-status docs.

Verification:

```powershell
python -m compileall -q server\alembic\versions\0004_completion_proof_gate.py server\models\work_order.py server\repositories\attachments.py server\services\work_order_service.py server\routers\work_orders.py server\tests\test_work_order_transitions.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
server\venv\Scripts\python.exe -m pytest server\tests\test_work_order_transitions.py -p no:cacheprovider
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- `git diff --check` passed.
- Local pytest could not run because `server\venv` does not have pytest
  installed.

## 2026-07-29 - v1.3 Hosted Smoke Harness

Decision:

- Add a repeatable v1.3 hosted smoke path before Vercel/portfolio promotion so
  the final showcase gate can prove the new PMC operations surface with
  synthetic data.
- Keep client invite/accept/approval decision as a manual hosted evidence step
  because invitation tokens are intentionally delivered by email/log and are not
  returned by the public API response.

Changes:

- Added `scripts/smoke_v13.py`.
- Updated `.github/workflows/hosted-smoke.yml` to run the v1.3 smoke script and
  upload `v13-smoke-evidence.json`.
- Added `V13_EVIDENCE_TEMPLATE.md`.
- Updated `scripts/smoke_v12.py` so synthetic proof metadata is attached before
  completed status, keeping it compatible with the v1.3 proof gate.
- Updated readiness, roadmap, QA, traceability, deployment, hosting, and README
  docs to reflect the v1.3 smoke/evidence path.

Verification:

```powershell
python -m compileall -q scripts\smoke_v12.py scripts\smoke_v13.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
git diff --check
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.

## 2026-07-29 - v1.3 Dispatch Board

Decision:

- Add the next local-only product-depth item before Vercel hosting: a
  coordinator/admin dispatch board for unassigned work, technician load, active
  lane work, and SLA risk.
- Implement it as a read-model with no migration, so it is safe to build before
  paid/hosted infrastructure work.

Changes:

- Added dispatch board response schemas in `server/models/dashboard.py`.
- Added tenant-scoped dispatch board work-order query in
  `server/repositories/work_orders.py`.
- Added `GET /dashboard/dispatch-board` for org admins/coordinators.
- Added mobile `DispatchBoardScreen` and linked it from the work-order list.
- Added v1.3 hosted smoke coverage for dispatch board shape and summary.
- Updated README, requirements, roadmap, traceability, QA, phase status,
  Vercel runbook, and v1.3 evidence template.

Verification:

```powershell
python -m compileall -q server\models\dashboard.py server\repositories\work_orders.py server\routers\dashboard.py server\tests\test_tenant_isolation.py scripts\smoke_v13.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
server\venv\Scripts\python.exe -c "import os, sys; from unittest.mock import patch; os.environ['JWT_SECRET_KEY']='test-secret-key-for-import-check-only'; sys.path.insert(0, 'server'); from models.user import User; from routers.dashboard import get_dispatch_board; user=User(id=1, organization_id=6, email='admin@example.com', full_name='Admin', role='org_admin', is_active=True); rows=[{'id':1,'title':'Leak','status':'open','priority':'emergency','assigned_technician_id':None,'property_id':3,'property_name':'West','client_id':9,'client_display_name':'Owner','vendor_id':None,'vendor_name':None,'created_at':'2026-07-28T00:00:00Z','sla_due_at':'2026-07-28T01:00:00Z'},{'id':2,'title':'Sink','status':'in_progress','priority':'medium','assigned_technician_id':8,'property_id':4,'property_name':'East','client_id':10,'client_display_name':'Owner B','vendor_id':11,'vendor_name':'Vendor','created_at':'2026-07-28T00:00:00Z','sla_due_at':None}]; techs=[{'id':8,'availability_status':'available','max_daily_jobs':4,'users':{'full_name':'Tech One','email':'tech@example.com'}}]; p1=patch('routers.dashboard.work_orders_repo.list_dispatch_board_work_orders', return_value=rows); p2=patch('routers.dashboard.technicians_repo.list_by_org', return_value=techs); p1.start(); p2.start(); board=get_dispatch_board(current_user=user, organization={'id':6}); p1.stop(); p2.stop(); print(board.summary.unassigned_count, board.technician_lanes[0].utilization_percent)"
git diff --check
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- Direct dispatch-board route smoke printed `1 25.0`.
- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.
- Focused pytest could not run because `server\venv` does not have pytest
  installed.
- Client Babel transform could not run because `client\node_modules` is not
  installed in this checkout.

## 2026-07-29 - v1.3 Duplicate Warnings

Decision:

- Add advisory duplicate detection before hosting so coordinators get a warning
  before creating likely repeated work at the same property/address and service
  type.
- Keep duplicate detection non-blocking because similar maintenance tickets can
  be legitimate follow-up work.

Changes:

- Added `WorkOrderDuplicateWarning` schema.
- Added tenant-scoped duplicate-warning query in
  `server/repositories/work_orders.py`.
- Added `POST /work-orders/duplicate-warnings` for org admins/coordinators.
- Added mobile duplicate-warning confirmation before manual work-order create.
- Added hosted v1.3 smoke coverage for duplicate-warning preflight.
- Updated README, requirements, roadmap, traceability, QA, phase status, Vercel
  runbook, and v1.3 evidence template.

Verification:

```powershell
python -m compileall -q server\models\work_order.py server\repositories\work_orders.py server\routers\work_orders.py server\tests\test_tenant_isolation.py scripts\smoke_v13.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
server\venv\Scripts\python.exe -c "import os, sys; from unittest.mock import patch; os.environ['JWT_SECRET_KEY']='test-secret-key-for-import-check-only'; sys.path.insert(0, 'server'); from models.user import User; from models.work_order import WorkOrderCreate; from routers.work_orders import check_duplicate_warnings; user=User(id=1, organization_id=6, email='admin@example.com', full_name='Admin', role='coordinator', is_active=True); payload=WorkOrderCreate(title='Kitchen leak', property_id=3, client_id=9, address='100 Demo Way', service_type='plumbing', auto_assign=True); rows=[{'id':2,'title':'Kitchen leak follow-up','status':'open','priority':'high','property_id':3,'property_name':'Demo Property','customer_name':'Synthetic Resident','address':'100 Demo Way','service_type':'plumbing','created_at':'2026-07-28T00:00:00Z','similarity_reason':'same property and service type'}]; p1=patch('routers.work_orders.clients_repo.get_by_id_in_org', return_value={'id':9}); p2=patch('routers.work_orders.properties_repo.get_by_id_in_org', return_value={'id':3,'client_id':9}); p3=patch('routers.work_orders.work_orders_repo.list_potential_duplicates', return_value=rows); p1.start(); p2.start(); p3.start(); warnings=check_duplicate_warnings(payload, current_user=user, organization={'id':6}); p1.stop(); p2.stop(); p3.stop(); print(len(warnings), warnings[0].similarity_reason)"
git diff --check
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- Direct duplicate-warning route smoke printed `1 same property and service
  type`.
- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.
- Focused pytest could not run because `server\venv` does not have pytest
  installed.
- Client Babel transform could not run because `client\node_modules` is not
  installed in this checkout.
