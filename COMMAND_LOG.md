# TechSync Command Log

This file records meaningful commands and verification steps so future sessions
can reconstruct what happened without relying on chat history.

## 2026-08-13 - Tooltip-First Role Workspace Polish

Scope:

- Added a reusable client `HintBubble` that opens a small explanation window on
  hover, keyboard focus, or tap.
- Moved role-home explanatory copy behind contextual help bubbles for navigation
  lanes, queue filters, work-order seed context, role actions, next-best action
  rationale, outcome cards, guidance rows, and event-lane cards.
- Moved work-order detail explanatory copy behind contextual help bubbles for
  readiness, flow, work-story, action-path, event playbook, last-update, and
  communication guidance.
- Updated documentation so the UI contract is explicit: visible surface shows
  labels, counts, statuses, work titles, and actions; `?` bubbles carry
  explanatory text.

Verification:

```powershell
cd C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync\client
npm.cmd run test:ci
npm.cmd run build:web
```

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

## 2026-07-29 - v1.3 Dashboard CSV Exports

Decision:

- Add downloadable CSV evidence for coordinator/admin dashboard views before
  hosting so operations report and dispatch board data can be shared or
  archived during investor-safe demos.
- Keep exports server-generated and tenant-scoped through the existing
  dashboard routes rather than adding a separate reporting subsystem.

Changes:

- Added `server/services/dashboard_export_service.py`.
- Added `GET /dashboard/operations-report/export`.
- Added `GET /dashboard/dispatch-board/export`.
- Added route-level regression coverage for both CSV responses.
- Updated `scripts/smoke_v13.py` to verify both dashboard CSV exports.
- Updated README, requirements, roadmap, traceability, QA, phase status,
  Vercel runbook, and v1.3 evidence template.

Verification:

```powershell
python -m compileall -q server\services\dashboard_export_service.py server\routers\dashboard.py server\tests\test_tenant_isolation.py scripts\smoke_v13.py
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
server\venv\Scripts\python.exe -c "import os, sys; from unittest.mock import patch; os.environ['JWT_SECRET_KEY']='test-secret-key-for-import-check-only'; sys.path.insert(0, 'server'); from models.user import User; from routers.dashboard import export_dispatch_board, export_operations_report; user=User(id=1, organization_id=6, email='admin@example.com', full_name='Admin', role='org_admin', is_active=True); stale=[{'id':1,'title':'Old leak','status':'open','priority':'high','assigned_technician_id':None,'property_id':3,'client_id':9,'created_at':'2026-07-28T00:00:00Z','sla_due_at':None}]; techs=[{'id':8,'availability_status':'available','max_daily_jobs':4,'users':{'full_name':'Tech One','email':'tech@example.com'}}]; dispatch=[{'id':2,'title':'New leak','status':'open','priority':'emergency','assigned_technician_id':None,'property_id':3,'property_name':'West','client_id':9,'client_display_name':'Owner','vendor_id':None,'vendor_name':None,'created_at':'2026-07-28T00:00:00Z','sla_due_at':None}]; patches=[patch('routers.dashboard.work_orders_repo.list_stale_work_orders', return_value=stale), patch('routers.dashboard.work_orders_repo.list_overloaded_technicians', return_value=[]), patch('routers.dashboard.work_orders_repo.list_property_hotspots', return_value=[]), patch('routers.dashboard.work_orders_repo.list_dispatch_board_work_orders', return_value=dispatch), patch('routers.dashboard.technicians_repo.list_by_org', return_value=techs)]; [p.start() for p in patches]; report=export_operations_report(current_user=user, organization={'id':6}); board=export_dispatch_board(current_user=user, organization={'id':6}); [p.stop() for p in patches]; print(report.media_type, board.media_type, 'stale_work_order' in report.body.decode(), 'summary,open_count' in board.body.decode())"
git diff --check
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- Direct dashboard CSV export smoke printed `text/csv text/csv True True`.
- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.
- Focused pytest was attempted but could not run because the current local
  `server\venv` still does not have pytest installed.

## 2026-07-29 - v1.3 Synthetic Demo Seed/Reset

Decision:

- Add repeatable local/demo database seed and reset tooling before Vercel
  hosting so the product can show the same synthetic PMC story every time.
- Scope reset to one deterministic synthetic organization slug,
  `techsync-ops-demo-pmc`, so the script cannot wipe arbitrary tenant data.

Changes:

- Added `scripts/seed_demo_data.py` with `status`, `seed`, and `reset` actions.
- Seed creates synthetic admin, coordinator, client, and technician users;
  technician profiles; clients; properties; vendors; active/stale/assigned/
  unassigned/completed work orders; internal/client messages; audit events; and
  proof attachment metadata.
- Added `DEMO_DATA_RUNBOOK.md`.
- Updated README, roadmap, QA, evidence, deployment, readiness, hosting, phase
  status, requirements, and traceability docs.

Verification:

```powershell
python -m compileall -q scripts\seed_demo_data.py
python scripts\seed_demo_data.py --help
git diff --check
```

Result:

- Compile passed.
- Script help rendered successfully with system Python.
- Backend-venv dependency load check printed `seed app modules loaded`.
- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.
- Database seed/reset was not run in this slice because no local
  `DATABASE_URL` was provided to this environment.

## 2026-07-29 - v1.3 Mobile PMC Directory

Decision:

- Keep hosting deferred as the absolute final gate and continue closing local
  product requirements first.
- Add the missing coordinator/admin mobile workflow for first-class clients,
  properties, and vendors so the PMC entity model is usable from the app, not
  only through the backend API.

Changes:

- Added `client/src/screens/PmcDirectoryScreen.js` with tabs for clients,
  properties, and vendors.
- Added create/edit forms for client, property, and vendor records, including
  active/inactive state, client type, property-client linking, and vendor
  service types.
- Added `PmcDirectory` navigation route.
- Added a `Directory` action to the work-order list for org admins and
  coordinators.
- Added client/property/vendor selectors to the work-order form so manual work
  orders can be linked to PMC records.
- Updated client/property/vendor/work-order PATCH routes to preserve
  explicitly-sent `null` fields with `model_dump(exclude_unset=True)`, allowing
  frontend edit forms to clear optional links and values.
- Added regression coverage for clearing client, property, vendor, and
  work-order optional fields/links.
- Updated README, roadmap, QA, traceability, requirements, phase status,
  public-readiness, and hosting/portfolio docs.

Verification:

```powershell
$env:JWT_SECRET_KEY='test-secret-key-for-import-check-only'; server\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'server'); import main; print(main.app.title)"; Remove-Item Env:JWT_SECRET_KEY
python -m compileall -q server\routers\clients.py server\routers\properties.py server\routers\vendors.py server\routers\work_orders.py server\tests\test_tenant_isolation.py
server\venv\Scripts\python.exe -c "import os, sys; from unittest.mock import patch; os.environ['JWT_SECRET_KEY']='test-secret-key-for-import-check-only'; sys.path.insert(0, 'server'); from models.client import ClientUpdate; from models.property import PropertyUpdate; from models.user import User; from models.work_order import WorkOrderUpdate; from routers.clients import update_client; from routers.properties import update_property; from routers.work_orders import update_work_order; user=User(id=5, organization_id=6, email='admin@example.com', full_name='Admin', role='org_admin', is_active=True); client_row={'id':9,'organization_id':6,'display_name':'Client','contact_name':None,'email':None,'phone':None,'client_type':'homeowner','notes':None,'is_active':True,'created_at':'2026-07-28T00:00:00Z','updated_at':'2026-07-28T00:00:00Z'}; prop_row={'id':3,'organization_id':6,'client_id':None,'name':'Property','address_line1':'1300 Demo Ridge','address_line2':None,'city':None,'state':None,'postal_code':None,'country':'US','unit':None,'access_notes':None,'latitude':None,'longitude':None,'is_active':True,'created_at':'2026-07-28T00:00:00Z','updated_at':'2026-07-28T00:00:00Z'}; wo_row={'id':1,'organization_id':6,'title':'Leak','description':None,'property_id':None,'client_id':None,'vendor_id':None,'customer_name':None,'address':None,'latitude':None,'longitude':None,'service_type':'plumbing','priority':'high','status':'open','assigned_technician_id':None,'created_by':5,'source':'manual','external_ref':None,'sla_due_at':None,'completed_at':None,'completion_notes':None,'completion_proof_verified_at':None,'completion_override_reason':None,'client_approval_status':'not_required','client_approval_requested_at':None,'client_approval_requested_by':None,'client_approval_decision_at':None,'client_approval_decision_by':None,'client_approval_notes':None,'created_at':'2026-07-28T00:00:00Z','updated_at':'2026-07-28T00:00:00Z'}; p1=patch('routers.clients.clients_repo.get_by_id_in_org', return_value={'id':9}); p2=patch('routers.clients.clients_repo.update', return_value=client_row); p3=patch('routers.properties.properties_repo.get_by_id_in_org', return_value={'id':3}); p4=patch('routers.properties.properties_repo.update', return_value=prop_row); p5=patch('routers.work_orders.work_orders_repo.get_by_id_in_org', return_value={'id':1}); p6=patch('routers.work_orders.work_orders_repo.update', return_value=wo_row); patches=[p1,p2,p3,p4,p5,p6]; [p.start() for p in patches]; c=update_client(9, ClientUpdate(contact_name=None, email=None), current_user=user, organization={'id':6}); pr=update_property(3, PropertyUpdate(client_id=None), current_user=user, organization={'id':6}); wo=update_work_order(1, WorkOrderUpdate(property_id=None, client_id=None, vendor_id=None), current_user=user, organization={'id':6}); print(c.contact_name is None, pr.client_id is None, wo.property_id is None); [p.stop() for p in patches]"
git diff --check
```

Result:

- Compile passed.
- FastAPI app imported successfully and printed `TechSync Ops API`.
- Direct PATCH/null route smoke printed `True True True`.
- `git diff --check` passed with normal Windows LF-to-CRLF warnings only.
- Focused pytest was attempted but could not run because the current local
  `server\venv` still does not have pytest installed.
- Client Babel/Jest checks could not run because `client\node_modules` is not
  installed in this checkout.

## 2026-07-29 - v1.3 PMC Directory CSV Exports

Decision:

- Continue closing non-hosting requirement buckets before any Vercel/portfolio
  showcase work.
- Add tenant-owned export paths for clients, properties, and vendors so PMC
  directory data is not trapped inside the tool.

Changes:

- Added `server/services/entity_export_service.py`.
- Added downloadable CSV endpoints:
  - `GET /clients/export`
  - `GET /properties/export`
  - `GET /vendors/export`
- Preserved existing tenant-scoped repository filters, including
  `active_only` and property `client_id` filtering.
- Added route tests covering organization scoping, CSV response headers, and
  vendor service-type flattening.
- Updated `scripts/smoke_v13.py` and `V13_EVIDENCE_TEMPLATE.md` to capture
  client/property/vendor CSV export evidence during the final hosted smoke
  gate.
- Updated README, roadmap, requirements, traceability, QA, public-readiness,
  and phase-status docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
npm.cmd run test:ci
```

Result:

- Backend tests passed: `113 passed`.
- Client tests passed: `2 passed suites`, `7 passed tests`.
- `npm ci` completed locally, but reported dependency audit findings that
  should be triaged separately instead of force-fixed.

## 2026-07-29 - v1.3 Mobile Operations Report Charts

Decision:

- Continue local-only v1.3 hardening and improve reporting usability before
  any hosting work.
- Add simple chart bars without introducing a chart dependency so the mobile
  operations report is easier to scan for coordinators and operators.

Changes:

- Added `client/src/utils/reportMetrics.js` for report chart row calculations.
- Added `client/src/utils/reportMetrics.test.js`.
- Added Operations Report chart sections:
  - Risk Snapshot for stale/overloaded/hotspot mix.
  - Capacity Pressure for highest overloaded technician utilization.
  - Hotspot Activity for repeated-property volume.
- Updated README, roadmap, QA, requirements, traceability, public-readiness,
  and phase-status docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `3 passed suites`, `11 passed tests`.
- Backend tests passed: `113 passed`.
- Compile check passed.

## 2026-07-29 - v1.3 Role-Based UX Landing Sweep

Decision:

- Start the exhaustive pre-hosting role UX sweep with a concrete mobile client
  improvement instead of waiting for final screenshots.
- Keep hosting deferred and improve role clarity on the first authenticated
  screen.

Changes:

- Added `client/src/utils/roleWorkflows.js`.
- Added `client/src/utils/roleWorkflows.test.js`.
- Added a role-specific work-order landing band for org admin, coordinator,
  technician, client, viewer, and vendor states.
- Replaced cramped manager header buttons with action cards for Directory,
  Dispatch, Report, and New Work.
- Added queue summary counts for total, open, active, and pending approval
  work.
- Added `ROLE_UX_SWEEP.md` to track remaining role walkthrough evidence before
  hosting.
- Updated README, roadmap, QA, requirements, traceability, public-readiness,
  and phase-status docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Result:

- Client tests passed: `4 passed suites`, `16 passed tests`.
- Backend tests passed: `113 passed`.

## 2026-07-29 - v1.3 Role-Aware Detail Screen Polish

Decision:

- Continue polishing UX locally before hosting by improving the work-order
  detail screen, where every role lands after the queue.
- Keep the change lightweight and dependency-free.

Changes:

- Extended `client/src/utils/roleWorkflows.js` with detail context and summary
  helpers.
- Added regression tests for client pending-approval detail copy, proof state,
  and detail summary counts.
- Added a role-aware command panel at the top of work-order details.
- Added summary tiles for status, client approval, proof, and messages.
- Updated `ROLE_UX_SWEEP.md`, QA, and phase-status docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Result:

- Client tests passed: `4 passed suites`, `19 passed tests`.
- Backend tests passed: `113 passed`.

## 2026-07-29 - v1.3 Work-Order Form Context Review

Decision:

- Continue local-only UX polishing before hosting by improving the manual
  work-order creation surface.
- Make client/property/vendor/address state visible before save so coordinators
  can catch incomplete or manual context sooner.

Changes:

- Added `client/src/utils/workOrderContextSummary.js`.
- Added `client/src/utils/workOrderContextSummary.test.js`.
- Added a compact "Review Before Save" panel to the mobile work-order form with
  linked/manual/open pills for client, property, vendor, and address context.
- Updated role UX, QA, roadmap, requirements, public-readiness, and phase-status
  docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Result:

- Client tests passed: `5 passed suites`, `23 passed tests`.
- Backend tests passed: `113 passed`.

## 2026-07-29 - v1.3 Completion Cycle-Time Reporting

Decision:

- Close the remaining completion cycle-time reporting gap before hosting.
- Keep the metric tenant-scoped, API-backed, CSV-exportable, smoke-testable,
  and visible in the mobile operations report.

Changes:

- Added `completion_cycles` to the backend operations report response.
- Added `list_completion_cycles` to compute average, fastest, and slowest
  created-to-completed hours by service type.
- Added completion cycle rows to the operations-report CSV export.
- Updated `scripts/smoke_v13.py` and `V13_EVIDENCE_TEMPLATE.md` so the final
  hosted gate verifies completion cycle metrics and export evidence.
- Added mobile completion cycle-time chart bars and detail cards to the
  Operations Report screen.
- Updated README, roadmap, requirements, traceability, QA, public-readiness, and
  phase-status docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `5 passed suites`, `24 passed tests`.
- Backend tests passed: `114 passed`.
- Compile check passed.

## 2026-07-29 - v1.3 Closeout PDF Export

Decision:

- Close the binary closeout PDF gap before hosting without adding a server PDF
  dependency.
- Keep HTML/text exports intact and add a lightweight PDF evidence path for the
  same closeout package data.

Changes:

- Added `build_closeout_pdf` to `server/services/closeout_export_service.py`.
- Extended `GET /work-orders/{work_order_id}/closeout-package/export` with
  `format=pdf`.
- Added closeout PDF service and route tests.
- Updated `scripts/smoke_v13.py` and `V13_EVIDENCE_TEMPLATE.md` so the final
  hosted gate verifies PDF closeout export.
- Updated README, roadmap, requirements, traceability, QA, public-readiness, and
  phase-status docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
npm.cmd run test:ci
```

Result:

- Backend tests passed: `115 passed`.
- Compile check passed.
- Client tests passed: `5 passed suites`, `24 passed tests`.

## 2026-07-29 - v1.3 Role-Aware Navigation Guard

Decision:

- Continue the local role-by-role UX sweep before hosting.
- Tighten the mobile navigation surface so manager-only screens are not mounted
  for technician, client, viewer, or vendor roles.

Changes:

- Added tested main-route access helpers to `client/src/utils/roleWorkflows.js`.
- Updated `client/App.js` so Work Order Form, Operations Report, Dispatch Board,
  and PMC Directory screens register only for org admin/coordinator roles.
- Updated role UX, QA, roadmap, and phase-status docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `5 passed suites`, `25 passed tests`.
- Backend tests passed: `115 passed`.
- Compile check passed.

## 2026-07-30 - v1.3 Cost Summary Reporting Foundation

Decision:

- Start cost/export enrichment without introducing billing, payment movement,
  or accounting-system integration.
- Keep the implementation tenant-scoped and useful for investor demo evidence:
  estimated cost, actual cost, invoice reference, grouped cost trends, and CSV
  export proof.

Changes:

- Added Alembic migration `0007` and base schema columns for
  `estimated_cost_cents`, `actual_cost_cents`, and `invoice_reference`.
- Added cost fields to work-order create/update/response models and creation
  route handling.
- Added tenant-scoped `list_cost_summary` repository query.
- Added `cost_summary` buckets to `/dashboard/operations-report`.
- Added cost summary rows to `/dashboard/operations-report/export`.
- Added synthetic cost data to `scripts/seed_demo_data.py`.
- Updated `scripts/smoke_v13.py` to require migration `0007`, submit synthetic
  work-order costs, verify closeout attachment manifests, and verify cost
  summary reporting/export evidence.
- Added mobile operations-report cost window controls, cost chart rows, and
  read-only cost summary cards.
- Updated README, QA, roadmap, requirements, traceability, phase, and v1.3
  evidence docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_tenant_isolation.py -p no:cacheprovider
npm.cmd run test:ci -- --runTestsByPath src/utils/reportMetrics.test.js
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
npm.cmd run test:ci
server\venv\Scripts\python.exe -m compileall -q server scripts
node -e "const babel=require('@babel/core'); babel.transformFileSync('src/screens/WorkOrderDetailsScreen.js',{presets:['module:metro-react-native-babel-preset'],babelrc:false,configFile:false}); console.log('WorkOrderDetailsScreen parse ok')"
```

Result:

- Focused backend tests passed: `50 passed`.
- Focused client tests passed: `1 suite`, `6 tests`.
- Full backend tests passed: `150 passed`.
- Full client tests passed: `7 passed suites`, `39 passed tests`.
- Compile check passed for `server` and `scripts`.

## 2026-07-30 - v1.3 In-App Role Evidence Dashboard

Decision:

- Reduce the remaining manual pre-hosting UX proof gap by making the role
  walkthrough audit visible from the app itself.
- Keep the evidence surface manager-only and local/demo oriented, with no
  hosting work.

Changes:

- Added manager-only `RoleEvidence` navigation and a main queue Evidence action
  for org admins/coordinators.
- Added `client/src/screens/RoleEvidenceScreen.js` to render readiness checks,
  role capture rows, screenshot filenames, proof notes, and safety checklist.
- Added `getRoleEvidenceDashboard()` so the screen, tests, and docs share the
  same evidence model.
- Updated role walkthrough controls so Evidence is documented as visible to
  managers and hidden from technician/client/viewer/vendor roles.
- Updated role UX, QA, roadmap, requirements, traceability, README, and phase
  docs.

Verification:

```powershell
npm.cmd run test:ci -- --runTestsByPath src/utils/roleWorkflows.test.js src/utils/roleWalkthrough.test.js
node -e "const babel=require('@babel/core'); for (const f of ['App.js','src/screens/RoleEvidenceScreen.js','src/screens/WorkOrdersListScreen.js']) { babel.transformFileSync(f,{presets:['module:metro-react-native-babel-preset'],babelrc:false,configFile:false}); console.log(f,'parse ok'); }"
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
```

Result:

- Focused role UX tests passed: `2 passed suites`, `18 passed tests`.
- App, Role Evidence screen, and work-order list Babel parse checks passed.
- Full client tests passed: `7 passed suites`, `40 passed tests`.
- Full backend tests passed: `160 passed`, with one existing Pydantic `dict()`
  deprecation warning.
- Compile check passed for `server` and `scripts`.
- Work-order detail screen Babel parse check passed.

## 2026-07-30 - v1.3 Closeout Attachment Manifest Export

Decision:

- Close the remaining attachment portability planning gap before hosting.
- Add a safe, tenant-scoped handoff manifest instead of embedding binary files
  or exposing provider-private storage paths.

Changes:

- Added closeout attachment JSON/CSV manifest builders to
  `server/services/closeout_export_service.py`.
- Added `GET /work-orders/{work_order_id}/closeout-package/attachments/export`
  with `format=json|csv`.
- Manifest rows include attachment filename, content type, file URL, uploader,
  timestamp, and explicit transfer notes.
- Manifest output omits private storage paths, storage access keys, and storage
  secret keys.
- Added backend tests for JSON/CSV download behavior and omitted storage-path
  guarantees.
- Updated README, requirements, traceability, QA, roadmap, and phase-status
  docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_closeout_package.py server\tests\test_tenant_isolation.py -p no:cacheprovider
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
```

Result:

- Focused backend tests passed: `57 passed`.
- Full backend tests passed: `149 passed`.
- Compile check passed for `server` and `scripts`.

## 2026-07-29 - v1.3 Tenant Data Export Bundle

Decision:

- Make the backup/restore/export requirement more than a runbook by adding an
  org-admin tenant JSON export endpoint before any hosting work.
- Keep the export safe for demo evidence by omitting credentials, provider
  identifiers, token hashes, and attachment storage paths.

Changes:

- Added `server/services/tenant_export_service.py`.
- Added `GET /organizations/me/export`.
- Added org-wide, tenant-scoped repository reads for work-order messages,
  work-order audit events, and attachment metadata.
- Kept attachment export to metadata only; binary files and private storage
  paths remain out of the JSON bundle.
- Extended `scripts/smoke_v13.py` to verify tenant JSON export shape and
  sensitive-field omission.
- Updated requirements, traceability, roadmap, QA, runbook, README, phase, and
  v1.3 evidence docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_tenant_isolation.py server\tests\test_security.py -p no:cacheprovider
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Tenant/security slice passed: `60 passed`.
- Backend tests passed: `146 passed`.
- Compile check passed for `server` and `scripts`.

## 2026-07-30 - v1.3 Role UX Evidence Readiness Audit

Decision:

- Continue moving toward hosting without deploying by tightening the final
  role-by-role screenshot/evidence path.
- Keep the screenshot manifest code-backed so role coverage, public-safety
  checks, and role privacy/control expectations are harder to accidentally
  drift.

Changes:

- Added `getRoleEvidenceReadinessAudit()` to
  `client/src/utils/roleWalkthrough.js`.
- Added `getRoleEvidenceChecklistMarkdown()` for a deterministic manual
  screenshot checklist generated from the same manifest.
- Added checks for synthetic login coverage, screen coverage, unique screenshot
  names, safety checks, manager controls, non-manager hidden controls,
  technician assigned routing, client/viewer privacy, and vendor access
  documentation.
- Updated role UX, evidence, QA, roadmap, requirements, README, and phase docs.

Verification:

```powershell
npm.cmd run test:ci
```

Result:

- Client tests passed: `7 passed suites`, `38 passed tests`.

## 2026-07-29 - v1.3 Lifecycle and Operations Runbook Batch

Decision:

- Continue bigger local-only requirement batches before hosting.
- Close more of the functional, nonfunctional, and system requirements without
  touching Vercel deployment or portfolio linking.

Changes:

- Added Alembic migration `0006` for explicit work-order lifecycle states:
  `paused`, `escalated`, and `archived`.
- Expanded backend status transitions so managers/coordinators/technicians can
  pause and escalate work while archive remains manager-only.
- Updated dashboard metrics, dispatch board summary, dispatch CSV exports,
  active queue filters, SLA/stale/workload semantics, duplicate warnings, and
  the base schema for the new lifecycle states.
- Updated mobile work-order detail actions, confirmations, status colors, list
  colors, report colors, and queue summary helpers for pause/escalate/archive.
- Expanded the synthetic demo seed to include paused, escalated, and archived
  work orders, raising the expected demo work-order count to 8.
- Added `OPERATIONS_RUNBOOK.md` for local/demo backup, restore, export,
  lifecycle, and monitoring evidence.
- Updated README, QA, roadmap, phase, requirements, traceability, demo runbook,
  v1.3 evidence, and pre-launch docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `6 passed suites`, `31 passed tests`.
- Backend tests passed: `143 passed`.
- Compile check passed for `server` and `scripts`.

## 2026-07-29 - v1.3 Accessibility Evidence Batch

Decision:

- Continue local-only hardening before hosting.
- Address the nonfunctional requirement for role dashboard and client approval
  accessibility by adding code-level labels/hints plus an evidence checklist.

Changes:

- Added `client/src/utils/accessibility.js` with shared helpers for work-order
  card labels, summary labels, role actions, form inputs, lifecycle actions,
  and evidence checklist text.
- Added `client/src/utils/accessibility.test.js` coverage for work-order
  announcement text, lifecycle transition labels/hints, input labels, role
  action labels, summary labels, and checklist visibility.
- Added accessibility roles, labels, and hints to the primary work-order list,
  role dashboard action cards, empty-state action, logout, dispatch board
  summary/work chips, work-order form inputs/selectors/save/cancel, and
  work-order detail approval, messaging, attachment, edit, and lifecycle
  controls.
- Added `ACCESSIBILITY_EVIDENCE.md` for the final manual screen-reader,
  small-width, touch comfort, and screenshot safety pass.
- Updated QA, roadmap, phase, requirements, traceability, and README docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `7 passed suites`, `36 passed tests`.
- Backend tests passed: `143 passed`.
- Compile check passed for `server` and `scripts`.

## 2026-07-29 - v1.3 Role Scope Regression Evidence

Decision:

- Turn the remaining role-access UX sweep items into backend regression proof
  before any public demo work.
- Keep screenshot walkthrough evidence separate for the final pre-hosting pass.

Changes:

- Added viewer detail-access regression coverage so viewer users cannot open
  another client-linked work order by ID.
- Added viewer message-list coverage proving requested internal messages are
  forced to client-visible messages.
- Added technician detail-access coverage so technicians cannot open unassigned
  work orders.
- Added attachment subresource coverage so unassigned technician access is
  blocked before attachment rows are queried.
- Updated role UX, QA, roadmap, phase, requirements, traceability, and README
  docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
npm.cmd run test:ci
python -m compileall -q server scripts
```

Result:

- Backend tests passed: `119 passed`.
- Client tests passed: `5 passed suites`, `25 passed tests`.
- Compile check passed.

## 2026-07-29 - v1.3 Mobile Touch Target Polish

Decision:

- Continue the pre-hosting role UX sweep by tightening small-screen touch
  comfort before screenshot evidence.
- Keep the work local-only and avoid changing route/API behavior.

Changes:

- Raised retry, segment, tab, selector, visibility, and secondary action touch
  targets to stable mobile-friendly minimum heights.
- Allowed report segments and detail visibility tabs to wrap on narrow screens.
- Added text centering for compact chip/button labels that can wrap.
- Added explicit minimum heights for tappable work-order cards/chips.
- Updated role UX, QA, roadmap, phase, requirements, traceability, and README
  docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `5 passed suites`, `25 passed tests`.
- Backend tests passed: `119 passed`.
- Compile check passed.

## 2026-07-29 - v1.3 Role Empty-State Polish

Decision:

- Improve the pre-hosting screenshot path by making empty queues feel
  intentional for each role instead of showing bare text.
- Keep empty actions role-safe: only org admin/coordinator roles get a create
  work-order action.

Changes:

- Added tested `getRoleEmptyState` helper copy for org admin, coordinator,
  technician, client, viewer, vendor, and default roles.
- Replaced the work-order list empty text with a role-aware empty panel.
- Added manager-only empty-state action routing to `WorkOrderForm`.
- Updated role UX, QA, roadmap, phase, requirements, traceability, and README
  docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `5 passed suites`, `26 passed tests`.
- Backend tests passed: `119 passed`.
- Compile check passed.

## 2026-07-29 - v1.3 Role UX Evidence Batch

Decision:

- Move from tiny UX slices to a broader pre-hosting evidence batch.
- Prepare the final role walkthrough path before hosting by aligning demo data,
  role manifest tests, and screenshot documentation.

Changes:

- Added viewer and vendor synthetic login users to `scripts/seed_demo_data.py`.
- Linked the viewer login to the synthetic owner-group client record and the
  vendor login to the synthetic Apex vendor record.
- Added `client/src/utils/roleWalkthrough.js` with a role-by-role walkthrough
  manifest, synthetic login map, screenshot filenames, visibility guardrails,
  and evidence safety checklist.
- Added `client/src/utils/roleWalkthrough.test.js` coverage for role order,
  manager/non-manager controls, privacy expectations, deterministic screenshot
  names, and safety guardrails.
- Added `ROLE_UX_EVIDENCE_TEMPLATE.md` for the final screenshot/walkthrough
  pass.
- Updated demo data, v1.3 evidence, pre-launch, role UX, QA, roadmap, phase,
  requirements, traceability, and README docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `6 passed suites`, `31 passed tests`.
- Backend tests passed: `119 passed`.
- Compile check passed for `server` and `scripts`.

## 2026-07-29 - v1.3 Mobile Retry-State Polish

Decision:

- Continue the local-only UX sweep before hosting.
- Standardize mobile API failure recovery so primary screens and work-order
  detail subloads give users a clear retry action.

Changes:

- Added reusable `client/src/components/ScreenErrorState.js`.
- Replaced duplicated retry panels on the work-order list, dispatch board,
  operations report, and PMC directory screens.
- Added explicit retry states for work-order detail message and attachment
  loading failures.
- Updated role UX, QA, roadmap, README, and phase-status docs.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
python -m compileall -q server scripts
```

Result:

- Client tests passed: `5 passed suites`, `25 passed tests`.
- Backend tests passed: `115 passed`.
- Compile check passed.

## 2026-07-30 - v1.3 Linked Vendor Portal Scope

Decision:

- Move vendor access from a staged placeholder into a scoped POC lane before
  hosting.
- Keep vendors limited to work orders linked to their active vendor record,
  vendor-visible messages, and read-only proof context.

Changes:

- Added Alembic migration `0008_vendor_visible_messages.py`.
- Expanded work-order message visibility to `internal`, `client`, and
  `vendor`.
- Added active vendor-email lookup and routed vendor list/detail access through
  the linked vendor record.
- Forced vendor message reads/writes to `vendor` visibility and kept viewers
  read-only.
- Blocked vendor/viewer attachment metadata creation and file upload attempts
  server-side.
- Updated mobile role copy, work-order detail message controls, and role
  walkthrough evidence planning for vendor queue/detail/empty-state capture.
- Added synthetic vendor-visible demo seed data for the Apex vendor user.
- Updated README, QA, roadmap, requirements, traceability, phase status, role
  UX sweep, and v1.3 evidence docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_tenant_isolation.py -p no:cacheprovider
npm.cmd run test:ci -- --runTestsByPath src/utils/roleWorkflows.test.js src/utils/roleWalkthrough.test.js
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
npm.cmd run test:ci
server\venv\Scripts\python.exe -m compileall -q server scripts
```

Result:

- Backend tenant isolation tests passed: `60 passed`, with one existing
  Pydantic `dict()` deprecation warning.
- Focused role UX tests passed: `2 passed suites`, `17 passed tests`.
- Full backend tests passed: `160 passed`, with the same Pydantic `dict()`
  deprecation warning.
- Full client tests passed: `7 passed suites`, `39 passed tests`.
- Compile check passed for `server` and `scripts`.

## 2026-07-30 - v1.3 Role UX Capture Pass Prep

Decision:

- Finish as much of the role-by-role UX friction pass as possible before
  hosting, without deploying or exposing provider credentials.
- Keep the final live screenshot pass honest: it requires a local/demo API with
  `DATABASE_URL` and `JWT_SECRET_KEY`, plus the Expo web client running.

Changes:

- Added manual proof checks to the manager-only Role Evidence screen for
  running each synthetic role, checking 390px and 320px widths, recording
  screen-reader notes, and reviewing screenshot safety.
- Added `ROLE_UX_CAPTURE_PASS.md` as the final local capture worksheet with run
  commands, synthetic logins, capture widths, 21 screenshot targets,
  screen-reader notes, and safety review checkboxes.
- Added `scripts/smoke_role_ux.py` to log in as admin, coordinator,
  technician, client, viewer, and vendor synthetic users and write sanitized
  role-scope API evidence.
- Ignored local `role-ux-smoke-evidence*.json` artifacts.
- Updated README, QA, roadmap, requirements, traceability, public readiness,
  accessibility, role UX, and v1.3 evidence docs so future sessions know this
  is prepared but live screenshot evidence is still pending.

Verification:

```powershell
server\venv\Scripts\python.exe -m compileall -q scripts\smoke_role_ux.py
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --help
cd client; node -e "const babel=require('@babel/core'); for (const f of ['App.js','src/screens/RoleEvidenceScreen.js','src/screens/WorkOrdersListScreen.js']) { babel.transformFileSync(f,{presets:['module:metro-react-native-babel-preset'],babelrc:false,configFile:false}); console.log(f,'parse ok'); }"
cd client; npm.cmd run test:ci -- --runTestsByPath src/utils/roleWalkthrough.test.js
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client; npm.cmd run test:ci
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Smoke script compile and help checks passed.
- App, Role Evidence screen, and work-order list Babel parse checks passed.
- Focused role walkthrough tests passed: `1 passed suite`, `9 passed tests`.
- Backend tests passed: `160 passed`, with one existing Pydantic `dict()`
  deprecation warning.
- Full client tests passed: `7 passed suites`, `41 passed tests`.
- Full compile check passed for `server` and `scripts`.
- `git diff --check` passed with Windows LF-to-CRLF warnings only.
- Live role login/screenshot capture was not run in this Codex shell because
  `DATABASE_URL` and `JWT_SECRET_KEY` are not present here.

## 2026-07-30 - v1.3 Local Role UX Live Smoke

Decision:

- Continue the final pre-hosting UX proof locally against the Neon demo
  database and Expo web client.
- Keep Vercel/portfolio hosting deferred.

Changes:

- Updated Expo web entrypoint to use `registerRootComponent(App)` so the web
  bundle mounts correctly.
- Replaced synthetic demo emails using the reserved `.local` suffix with
  `@demo.techsyncops.dev` addresses because FastAPI/Pydantic email validation
  rejects special-use domains.
- Updated the role UX smoke script to respect login rate limiting by retrying
  after a `429` response instead of weakening API security.
- Updated the role UX capture login from Lena to Marco because Marco owns the
  active assigned synthetic work needed for technician queue/detail evidence.
- Updated role capture, demo data, QA, README, and evidence docs with the live
  local results and clearer PowerShell/clipboard instructions.

Verification:

```powershell
python -m alembic upgrade head
python -m alembic current
python ..\scripts\seed_demo_data.py seed --reset-existing
python ..\scripts\seed_demo_data.py status
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --base-url "http://127.0.0.1:8000" --output role-ux-smoke-evidence.json
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client; npm.cmd run test:ci
server\venv\Scripts\python.exe -m compileall -q scripts\seed_demo_data.py scripts\smoke_role_ux.py
```

Result:

- Neon demo database reported `0008 (head)`.
- Synthetic demo seed succeeded with 8 users, 3 technicians, 2 clients,
  3 properties, 2 vendors, 8 work orders, 4 messages, 1 attachment, and
  13 events.
- Admin login, admin workspace, and admin work-order detail were manually
  observed in Expo web at `http://localhost:19006`.
- Role UX smoke passed: `67 checks`.
- Backend tests passed: `160 passed`, with one existing Pydantic `dict()`
  deprecation warning.
- Client tests passed: `7 passed suites`, `41 passed tests`.
- Script compile checks passed.
- The old reserved-domain synthetic email suffix is no longer present in
  tracked files.

## 2026-07-30 - v1.3 Empty-State Evidence Personas

Decision:

- Keep the final role-by-role evidence pass honest by separating primary
  active-role screenshots from empty-state screenshots.
- Add deterministic no-work personas to the synthetic seed instead of manually
  altering database rows during capture.

Changes:

- Added `quiet-owner.demo@demo.techsyncops.dev` as a viewer linked to a client
  profile with no work orders.
- Added `quiet-vendor.demo@demo.techsyncops.dev` as a vendor linked to a vendor
  profile with no work orders.
- Documented `lena.tech@demo.techsyncops.dev` as the technician empty-queue
  screenshot persona while keeping `marco.tech@demo.techsyncops.dev` as the
  active assigned technician capture persona.
- Updated the role walkthrough manifest, capture worksheet, evidence template,
  demo runbook, v1.3 evidence template, role UX sweep, and phase tracker.
- Expanded the role UX smoke script so empty-state personas are checked after
  the next clean seed reset.

Expected next clean seed counts:

```text
users: 10
technicians: 3
clients: 3
properties: 3
vendors: 3
work_orders: 8
messages: 4
attachments: 1
events: 13
```

## 2026-07-30 - v1.3 Technician Empty Queue Hardening

Decision:

- Treat the role UX pass as product hardening, not only screenshot capture.
- Keep the technician landing queue limited to active assigned work when the
  mobile app hits the generic `/work-orders` endpoint without filters.

Changes:

- Updated the backend technician `/work-orders` path so unfiltered requests use
  the same active assigned queue behavior as `/work-orders/mine`.
- Added regression coverage proving unfiltered technician listing calls the
  active assigned queue and does not fall through to the generic filtered list.
- Tightened narrow work-order detail summary tiles so two-line values can fit at
  320px-class widths.
- Updated role UX evidence docs with the live technician empty-state DOM proof
  and the remaining manual screenshot/screen-reader evidence tasks.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Backend tests passed: `161 passed`, with one existing Pydantic `dict()`
  deprecation warning.
- Client tests passed: `7 passed suites`, `43 passed tests`.
- Compile checks passed.
- Diff hygiene passed with normal Windows LF/CRLF warnings.
- Local browser DOM proof confirmed `lena.tech@demo.techsyncops.dev` sees
  `Total work orders: 0` and `No assigned jobs`.

## 2026-07-30 - v1.3 Role UX Evidence Pack Builder

Decision:

- Add a repeatable local evidence-pack step before hosting so screenshot
  completeness, role UX smoke status, and manual safety checks are visible in
  one place.
- Keep generated evidence Markdown local-only by default, like smoke JSON and
  screenshot folders.

Changes:

- Added `scripts/build_role_ux_evidence_pack.py`.
- The script reads sanitized `role-ux-smoke-evidence.json`, inventories the
  expected role screenshot filenames, flags missing/extra/unsafe artifact names,
  and writes a local Markdown report.
- Added `--strict` mode for the final gate, where missing screenshots or failed
  smoke evidence should return a non-zero exit.
- Added pytest coverage for smoke summary handling, screenshot inventory, and
  sanitized Markdown generation.
- Updated `.gitignore` so generated `role-ux-evidence-pack*.md` reports are not
  committed accidentally.
- Updated the role UX capture docs, evidence template, sweep tracker, and phase
  status with the new evidence-pack step.

Local report result from current artifacts:

- Smoke evidence: pass, `69` checks, `tokens_saved: false`.
- Screenshot inventory: `18` of `21` manifest screenshots present.
- Missing current-manifest screenshots:
  - `techsync-ops-org_admin-05-create-work.png`
  - `techsync-ops-viewer-03-viewer-empty.png`
  - `techsync-ops-vendor-03-vendor-empty.png`
- Extra local PNGs are older/manual responsive or evidence captures and remain
  ignored.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_role_ux_evidence_pack.py -p no:cacheprovider
server\venv\Scripts\python.exe scripts\build_role_ux_evidence_pack.py --smoke role-ux-smoke-evidence.json --screenshots local-role-ux-evidence --output role-ux-evidence-pack.md --environment local
```

Result:

- Evidence-pack tests passed: `3 passed`.
- Local evidence report generated successfully and stayed ignored by Git.
- Full backend tests passed after the docs/script update: `164 passed`, with
  one existing Pydantic `dict()` deprecation warning.
- Full client tests passed: `7 passed suites`, `43 passed tests`.
- Compile and diff hygiene checks passed, with normal Windows LF/CRLF warnings.

## 2026-07-30 - v1.3 Manual UX Evidence Gate and Warning Cleanup

Decision:

- Keep hosting deferred and continue reducing the final local UX evidence
  blocker.
- Turn manual screen-reader, small-width, role-scope, and screenshot safety
  observations into a local evidence-pack input instead of leaving them only as
  Markdown checklist memory.
- Clean the known Pydantic v2 deprecation source while touching the backend
  proof path.

Changes:

- Added `ROLE_UX_MANUAL_NOTES_TEMPLATE.json` as the tracked template for final
  local manual UX/accessibility/screenshot safety notes.
- Updated `.gitignore` so filled `local-role-ux-manual-notes*.json` files stay
  local-only.
- Extended `scripts/build_role_ux_evidence_pack.py` with `--manual-notes`
  support, manual-note validation, report summary output, and strict-mode
  failure when manual notes are incomplete.
- Added pytest coverage for clean and incomplete manual notes.
- Replaced remaining Pydantic v1-style payload `.dict()` calls with
  `.model_dump()` in client/property/vendor/technician/work-order create paths.
- Updated the role UX capture, evidence, accessibility, roadmap, QA, and phase
  docs to include the manual-notes workflow.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\build_role_ux_evidence_pack.py --smoke role-ux-smoke-evidence.json --screenshots local-role-ux-evidence --manual-notes local-role-ux-manual-notes.json --output role-ux-evidence-pack.md --environment local
git diff --check
```

Result:

- Backend tests passed: `167 passed`.
- Client tests passed: `7 passed suites`, `43 passed tests`.
- Compile checks passed.
- Capture prep generated local ignored files successfully:
  - `local-role-ux-evidence`
  - `local-role-ux-manual-notes.json`
  - `local-role-ux-capture-manifest.md`
- Capture prep reported `18/21` screenshots present and `3` still missing.
- Evidence-pack dry run generated `role-ux-evidence-pack.md` and confirmed the
  same `3` missing screenshots.
- Diff hygiene passed with normal Windows LF/CRLF warnings.

## 2026-07-30 - v1.3 Evidence Gate Blocker Summary

Decision:

- Make the final local evidence gate more actionable before hosting by printing
  exact screenshot and manual-note blockers instead of only counts.
- Add sanitized machine-readable evidence output for the future final gate
  without committing local evidence artifacts.

Changes:

- Extended `scripts/build_role_ux_evidence_pack.py` to return exact screenshot
  gaps, manual failed checks, missing notes, malformed checks, unsafe filenames,
  and screenshot counts.
- Added CLI blocker printing so the terminal lists the exact remaining
  screenshot filenames and manual note keys.
- Added `--summary-json` support to write ignored
  `role-ux-evidence-summary.json` output.
- Updated `.gitignore` so generated summary JSON remains local-only.
- Added pytest coverage for sanitized summary JSON output.
- Updated role UX capture, evidence, accessibility, roadmap, QA, sweep, and
  phase docs to include the summary JSON final gate.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\build_role_ux_evidence_pack.py --smoke role-ux-smoke-evidence.json --screenshots local-role-ux-evidence --manual-notes local-role-ux-manual-notes.json --output role-ux-evidence-pack.md --summary-json role-ux-evidence-summary.json --environment local
git diff --check
```

Result:

- Backend tests passed: `165 passed`; the prior Pydantic `dict()` warning no
  longer appears.
- Client tests passed: `7 passed suites`, `43 passed tests`.
- Compile checks passed.
- Evidence-pack dry run generated `role-ux-evidence-pack.md`, still showing
  `3` missing screenshots and pending local manual notes until the final
  capture pass is filled.
- Diff hygiene passed with normal Windows LF/CRLF warnings.

## 2026-07-30 - v1.3 Role UX Capture Prep Helper

Decision:

- Keep reducing the final non-hosting evidence blocker by turning screenshot
  capture setup into one repeatable local command.
- Make the helper safe by preserving any existing filled manual notes unless
  overwrite is explicitly requested.

Changes:

- Added `scripts/prepare_role_ux_capture.py`.
- The helper creates `local-role-ux-evidence`, copies
  `ROLE_UX_MANUAL_NOTES_TEMPLATE.json` to
  `local-role-ux-manual-notes.json` when missing, and writes
  `local-role-ux-capture-manifest.md`.
- The generated manifest groups all 21 screenshot targets by role, marks
  present/missing files, and includes the strict evidence-pack command for the
  final local gate.
- Updated `.gitignore` so the generated capture manifest stays local-only.
- Added pytest coverage proving the helper creates capture files, preserves
  existing notes by default, and overwrites only when requested.
- Updated role UX, accessibility, roadmap, QA, and phase docs to point the
  final manual capture pass through the helper.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\prepare_role_ux_capture.py
server\venv\Scripts\python.exe scripts\build_role_ux_evidence_pack.py --smoke role-ux-smoke-evidence.json --screenshots local-role-ux-evidence --manual-notes local-role-ux-manual-notes.json --output role-ux-evidence-pack.md --environment local
git diff --check
```

## 2026-07-31 - v1.3 DB-Assisted Invite Approval Smoke Proof

Decision:

- Close the remaining pre-hosting proof gap for client invitation acceptance
  and accepted-client approval without weakening the production invitation API.
- Keep the raw invitation token private by inserting only a hashed synthetic
  token directly into the demo database, then proving the user path through the
  public invitation endpoint.
- Keep hosted email/log verification as a final deployment-gate manual check.

Changes:

- Added optional `--invite-database-url` support to `scripts/smoke_v13.py`.
- Added a DB-assisted synthetic invitation helper that stores a hashed token
  and never writes the raw token, bearer token, password, or database URL to
  evidence.
- Extended the v1.3 smoke path to accept the synthetic client invitation
  through `POST /invitations/accept`, then approve the pending work order with
  the accepted client token.
- Added isolated pytest coverage for stable opaque-token hashing and the safe
  direct invitation insert shape.
- Updated README, demo-data runbook, v1.3 evidence template, QA checklist,
  roadmap, and phase-status docs to describe the local proof path and final
  hosted follow-up boundary.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\smoke_v13.py --help
git diff --check
```

Result:

- Backend tests passed: `170 passed`.
- Client tests passed: `7 passed suites`, `43 passed tests`.
- Compile checks passed.
- Smoke CLI help showed the optional `--invite-database-url` flag.
- Diff hygiene passed with normal Windows LF/CRLF warnings.

## 2026-07-31 - v1.3 Role UX Scenario-Ready Smoke Checks

Decision:

- Turn the local role UX smoke from a broad access check into a screenshot-
  readiness gate before the final manual capture pass.
- Keep the final screenshots and screen-reader notes local/manual, but fail
  earlier when the seeded demo tenant is not ready to tell the role-by-role
  story.

Changes:

- Extended `scripts/smoke_role_ux.py` with seeded scenario checks for:
  manager lifecycle depth, technician active assigned work, client pending
  approval, viewer scoped/read-only work, linked Apex vendor work, and vendor-
  visible message evidence.
- Added pytest coverage for the client, vendor, and manager scenario gates.
- Updated README, role UX capture notes, QA checklist, roadmap, and phase
  status so the final non-hosting evidence pass includes screenshot-ready seed
  validation.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --base-url http://127.0.0.1:8000 --output role-ux-smoke-evidence.json
git diff --check
```

Result:

- Backend tests passed: `174 passed`.
- Client tests passed: `7 passed suites`, `43 passed tests`.
- Compile checks passed.
- Live role UX smoke reached the local API and wrote sanitized evidence, but
  failed the strict gate because the current demo database is from an older
  seed and the secondary empty-state accounts returned `401`.
- Diff hygiene passed with normal Windows LF/CRLF warnings.

## 2026-07-31 - v1.3 Strict Demo Seed Readiness Gate

Decision:

- Make the final screenshot blocker easier to diagnose by teaching the demo
  seed status command to fail clearly when the database is stale or incomplete.
- Keep this local/demo only and avoid writing credentials or provider details
  to tracked files.

Changes:

- Added expected counts, required synthetic login users, and screenshot-
  scenario readiness checks to `scripts/seed_demo_data.py`.
- Added `status --strict` so final capture prep can exit non-zero when the demo
  tenant is missing secondary empty-state personas or seeded scenario depth.
- Added pytest coverage for the readiness evaluator, including stale
  empty-state seed detection and unseeded database detection.
- Updated README, demo-data runbook, role UX capture pass notes, QA checklist,
  roadmap, and phase status with the strict seed gate.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\seed_demo_data.py --help
git diff --check
```

Result:

- Backend tests passed: `177 passed`.
- Client tests passed: `7 passed suites`, `43 passed tests`.
- Compile checks passed.
- Seed helper CLI help shows the new `--strict` option.
- Diff hygiene passed with normal Windows LF/CRLF warnings.
- Secret scan only matched documented placeholders and prior scan commands; no
  live-looking provider token, database URL, or private key was found in this
  batch.

## 2026-07-31 - v1.3 Final Role Evidence Gate Hardening

Decision:

- Make the final local UX evidence pass harder to miss or half-complete before
  any Vercel/portfolio hosting work begins.
- Keep the pass local-only and avoid storing screenshots, credentials, database
  URLs, or filled manual notes in tracked files.

Changes:

- Added capture preflight steps, viewport gates, and role-specific friction
  focus rows to the shared role walkthrough model and the manager-only Role
  Evidence screen.
- Updated the generated local capture manifest so it shows the same strict seed,
  role smoke, capture prep, manual walkthrough, strict evidence-pack, and
  screenshot-safety order.
- Expanded `ROLE_UX_MANUAL_NOTES_TEMPLATE.json` with per-role and per-viewport
  note sections.
- Tightened `scripts/build_role_ux_evidence_pack.py --strict` so final manual
  evidence requires checklist notes, role-by-role notes, and viewport notes.
- Updated README, QA checklist, phase status, roadmap, accessibility evidence,
  role capture pass notes, and role evidence template with the stricter final
  local gate.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\prepare_role_ux_capture.py --help
server\venv\Scripts\python.exe scripts\build_role_ux_evidence_pack.py --help
git diff --check
```

Result:

- Backend tests passed: `179 passed`.
- Client tests passed: `7 passed suites`, `45 passed tests`.
- Compile checks passed.
- Capture-prep and evidence-pack helper CLIs both showed help successfully.
- Diff hygiene passed with normal Windows LF/CRLF warnings.

## 2026-07-31 - v1.3 Pre-Hosting Readiness Doctor

Decision:

- Add one local command that answers "what still blocks hosting?" before any
  Vercel or portfolio showcase work is started.
- Keep the readiness summary local/ignored and avoid contacting external
  providers or storing secrets.

Changes:

- Added `scripts/pre_hosting_readiness.py` to summarize tracked readiness
  files, ignored local evidence artifacts, manual-notes template coverage,
  screenshot plan integrity, capture manifest presence, role smoke evidence,
  screenshot inventory, manual notes, and evidence summary JSON.
- Added pytest coverage for both a tooling-ready but evidence-blocked repo and
  a fully complete local evidence set.
- Added `pre-hosting-readiness*.json` to `.gitignore`.
- Updated README, QA checklist, phase status, roadmap, pre-launch checklist,
  and role capture pass docs with the new final local readiness command.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_pre_hosting_readiness.py server\tests\test_role_ux_evidence_pack.py server\tests\test_prepare_role_ux_capture.py -p no:cacheprovider
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
git check-ignore pre-hosting-readiness-summary.json role-ux-evidence-summary.json local-role-ux-manual-notes.json local-role-ux-capture-manifest.md
```

Result:

- Backend tests passed: `181 passed`.
- Client tests passed: `7 passed suites`, `45 passed tests`.
- Compile checks passed.
- Readiness helper CLI help displayed successfully.
- Readiness doctor ran locally and reported `Ready for hosting gate: False`
  with 4 expected blockers: stale/blocked role smoke, 18/21 screenshots
  present, incomplete manual notes, and evidence summary blockers.
- Git ignore check confirmed local readiness and role-evidence artifacts remain
  ignored.
- Diff hygiene passed with normal Windows LF/CRLF warnings.

## 2026-07-31 - v1.3 Role Smoke Stale-Seed Diagnostics

Decision:

- Close the first pre-hosting blocker by making stale quiet viewer/vendor seed
  failures diagnosable from the sanitized role smoke evidence.
- Keep the fix local-only: no hosting, no provider writes, and no secrets in
  tracked docs or generated evidence.

Changes:

- Added `scripts/smoke_role_ux.py --diagnose` to read an existing
  `role-ux-smoke-evidence.json` and print stale-seed guidance without rerunning
  the API probe.
- Added sanitized smoke diagnostics to newly generated smoke evidence.
- Updated `scripts/pre_hosting_readiness.py` so blocked quiet viewer/vendor
  logins are reported as a stale demo seed with the exact reset/status/smoke
  recovery path.
- Added pytest coverage for stale empty-state smoke diagnosis and readiness
  doctor messaging.
- Updated README, QA checklist, roadmap, phase status, role capture pass notes,
  and demo data runbook with the diagnostic command and recovery path.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_smoke_role_ux.py server\tests\test_pre_hosting_readiness.py -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --help
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --diagnose role-ux-smoke-evidence.json
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
```

Result:

- Focused stale-seed/readiness tests passed: `9 passed`.
- Backend tests passed: `184 passed`.
- Client tests passed: `7 passed suites`, `45 passed tests`.
- Compile checks passed.
- Smoke helper CLI help now shows `--diagnose`.
- Smoke helper diagnosis confirmed the current stale local evidence points to
  missing quiet viewer/vendor logins and the reseed recovery path.
- Readiness doctor still correctly blocks hosting, but blocker #1 now explains
  stale quiet viewer/vendor seed recovery.

## 2026-07-31 - v1.3 Named Screenshot Blocker Output

Decision:

- Close the second pre-hosting evidence blocker by making the remaining
  screenshot gap exact in both the capture-prep terminal output and readiness
  doctor report.
- Keep evidence files local/ignored and avoid adding any screenshots, secrets,
  or provider data to the repository.

Changes:

- Updated `scripts/prepare_role_ux_capture.py` to print missing screenshot
  capture rows as `role / screen: filename`.
- Updated `scripts/pre_hosting_readiness.py` to name missing screenshot files
  in the `screenshot_inventory` blocker detail.
- Added tests for named missing screenshot descriptions and readiness doctor
  screenshot blocker output.
- Updated README, QA checklist, phase status, roadmap, and role capture pass
  docs so the manual capture flow points to exact remaining rows.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_prepare_role_ux_capture.py server\tests\test_pre_hosting_readiness.py server\tests\test_role_ux_evidence_pack.py -p no:cacheprovider
server\venv\Scripts\python.exe scripts\prepare_role_ux_capture.py
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
```

Result:

- Focused evidence-tooling tests passed: `14 passed`.
- Backend tests passed: `186 passed`.
- Client tests passed: `7 passed suites`, `45 passed tests`.
- Compile checks passed.
- Capture prep now reports 18/21 screenshots present and names the three
  remaining rows:
  - `org_admin / WorkOrderForm: techsync-ops-org_admin-05-create-work.png`
  - `viewer / WorkOrdersList: techsync-ops-viewer-03-viewer-empty.png`
  - `vendor / WorkOrdersList: techsync-ops-vendor-03-vendor-empty.png`
- Readiness doctor still blocks hosting as expected, but the screenshot blocker
  now names the exact remaining capture files.

## 2026-07-31 - v1.3 Inline Role Smoke Failure Guidance

Decision:

- Improve the next local evidence run by making a failed role smoke print the
  failed checks and stale-seed recovery hint immediately.
- Keep the separate `--diagnose` path for existing smoke JSON, but avoid making
  the user run it as a second step after an ordinary failed smoke.

Changes:

- Added a sanitized failed-check printer to `scripts/smoke_role_ux.py`.
- Failed role smoke output now includes the failed check keys/details and, when
  the quiet viewer/vendor pattern is detected, the stale-seed diagnosis plus
  reset/status/smoke recovery path.
- Added stdout regression coverage so stale-seed recovery guidance stays
  visible in the CLI output.
- Updated role capture, demo data, QA, roadmap, and phase-status docs.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_smoke_role_ux.py -p no:cacheprovider
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --help
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --diagnose role-ux-smoke-evidence.json
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
cd client
npm.cmd run test:ci
cd ..
server\venv\Scripts\python.exe -m compileall -q server scripts
```

Result:

- Focused smoke tests passed: `7 passed`.
- Backend tests passed: `187 passed`.
- Client tests passed: `7 passed suites`, `45 passed tests`.
- Compile checks passed.
- Existing local smoke evidence diagnosis still points to the stale quiet
  viewer/vendor seed and the reseed recovery path.

## 2026-07-31 - v1.3 Expo Web Logout and Screenshot Inventory Closeout

Decision:

- Fix the role-capture logout blocker before continuing manual evidence.
- Keep mobile/native logout confirmation, but make Expo web logout immediate
  because the web `Alert.alert` confirmation path was not reliably firing.
- Treat the `quiet-*` users as local synthetic empty-state personas only.

Changes:

- Added `client/src/utils/logoutFlow.js` and focused Jest coverage.
- Updated `WorkOrdersListScreen` so Expo web logout clears the local session
  immediately, while iOS/Android still use the confirmation prompt.
- Confirmed the three previously missing local screenshot filenames now exist:
  - `techsync-ops-org_admin-05-create-work.png`
  - `techsync-ops-viewer-03-viewer-empty.png`
  - `techsync-ops-vendor-03-vendor-empty.png`
- Updated QA, phase status, and role UX capture docs so screenshot inventory is
  closed and remaining work is manual notes/evidence-pack validation.

Verification:

```powershell
npm.cmd run test:ci -- logoutFlow.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused logout tests passed: `1 passed suite`, `3 passed tests`.
- Client tests passed: `8 passed suites`, `48 passed tests`.
- Backend tests passed: `187 passed`.
- Compile checks passed.
- `git diff --check` reported only existing Windows LF-to-CRLF warnings.
- Readiness doctor still blocks hosting as expected on manual notes and the
  final evidence summary, but `screenshot_inventory` is now `PASS` with all
  21 expected screenshots present.

## 2026-08-11 - v1.3 Active User Orientation Pass

Decision:

- Mature the role landing experience before hosting by helping each logged-in
  user immediately understand their role, visible scope, next move, and
  guardrail.
- Replace awkward synthetic empty-state display names with clearer no-work
  personas while keeping stable `quiet-*` emails for repeatable role proof.

Changes:

- Added tested role user-experience helpers for admin, coordinator,
  technician, client, viewer, and vendor personas.
- Updated the work-order landing screen with a role badge, scope line, and
  guidance rows that respond to queue counts, pending approvals, active work,
  and empty-state guardrails.
- Renamed synthetic empty-state display names from Quiet Owner/Vendor to
  No-Work Owner/Vendor personas in the demo seed.
- Updated requirements, traceability, roadmap, phase status, QA checklist, and
  role capture docs.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
server\venv\Scripts\python.exe -m pytest server\tests\test_seed_demo_data.py -p no:cacheprovider
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `12 passed tests`.
- Focused seed tests passed: `3 passed`.
- Client tests passed: `8 passed suites`, `50 passed tests`.
- Backend tests passed: `187 passed`.
- Pre-hosting readiness remains correctly blocked only by manual notes and the
  final evidence summary; role smoke and all 21 screenshot filenames still
  pass.

## 2026-08-11 - v1.3 Detail and Form Guidance Maturity Pass

Decision:

- Continue maturing the role-by-role experience locally before hosting by
  reducing ambiguity inside the two highest-friction workflows: work-order
  detail review and work-order create/edit.
- Keep Vercel/portfolio hosting deferred until local role UX evidence is
  complete.

Changes:

- Added tested role-aware detail guidance rows for admin, coordinator,
  technician, client, viewer, and vendor users.
- Updated the work-order detail command panel with scope, current action, and
  guardrail copy derived from role and available capabilities.
- Added tested work-order form guidance rows for linked and manual intake
  states.
- Updated the create/edit work-order form with pre-save guidance that explains
  intent, linked/manual context, and open context before saving.
- Updated roadmap, requirements, traceability, QA, phase status, and role UX
  capture docs.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js workOrderContextSummary.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
git diff --check
```

Result:

- Focused client tests passed: `2 passed suites`, `18 passed tests`.
- Full client tests passed: `8 passed suites`, `52 passed tests`.
- Backend tests passed: `187 passed`.
- Compile checks passed.
- Pre-hosting readiness remains correctly blocked only by manual notes and the
  final evidence summary; tracked readiness files, ignored local evidence,
  screenshot plan, capture manifest, role smoke, and all 21 screenshots pass.
- `git diff --check` reported only existing Windows LF-to-CRLF warnings.

## 2026-08-11 - v1.3 Work-Order Handoff Interoperability Pass

Decision:

- Make TechSync Ops feel more like a SaaS collaboration system by showing who
  owns the next move, what the work order is waiting on, and which audiences
  are connected to the work.
- Keep this local-only and pre-hosting; the goal is user maturity before the
  final Vercel/portfolio gate.

Changes:

- Added tested work-order flow rows for `Next Owner`, `Waiting On`, and
  `Visible To`, derived from assignment, approval, status, proof, client links,
  and vendor links.
- Updated work-order queue cards with compact handoff chips so every role can
  scan ownership and visibility before opening a detail page.
- Updated work-order detail command panels with a fuller interoperability strip
  before role guidance, approval, messages, proof, and lifecycle controls.
- Kept message visibility language explicit: broad work-order audience does
  not weaken internal/client/vendor message separation.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `14 passed tests`.
- Full client tests passed: `8 passed suites`, `53 passed tests`.
- Backend tests passed: `187 passed`.
- Python compile checks passed.
- Pre-hosting readiness remains correctly blocked only by final manual evidence:
  local notes and evidence summary still need completion; tracked readiness
  files, ignored local artifacts, manual-notes template, screenshot plan,
  capture manifest, role smoke, and all 21 screenshots pass.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-11 - v1.3 Role UX Manual Evidence Prep Repair

Decision:

- Remove friction from the final evidence gate by letting capture prep repair
  stale local manual-note files into the current checklist, role-note, and
  viewport-note schema without deleting any existing reviewer notes.
- Keep generated screenshots, smoke JSON, evidence packs, manual notes, and
  readiness summaries ignored/local-only.

Changes:

- Updated `scripts/prepare_role_ux_capture.py` to detect older
  `local-role-ux-manual-notes.json` files, merge them with the current tracked
  template, and preserve existing reviewer/check notes by key.
- Added regression coverage for stale manual-note repair and unchanged
  screenshot manifest behavior.
- Ran capture prep locally; it repaired the manual notes schema and confirmed
  all 21 expected role screenshots are present.
- Rebuilt the ignored local role UX evidence summary and pre-hosting readiness
  summary; the only remaining blocker is manual note completion.
- Updated roadmap, phase status, QA checklist, and role capture docs to record
  the narrowed evidence blocker.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_prepare_role_ux_capture.py server\tests\test_role_ux_evidence_pack.py -p no:cacheprovider
server\venv\Scripts\python.exe scripts\prepare_role_ux_capture.py
server\venv\Scripts\python.exe scripts\build_role_ux_evidence_pack.py --summary-json role-ux-evidence-summary.json
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused evidence tooling tests passed: `11 passed`.
- Full client tests passed: `8 passed suites`, `53 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- Capture prep repaired local manual notes and reported `21/21` screenshots
  present with `0` missing.
- Evidence pack reports no screenshot blocker; manual checklist, role,
  viewport, screen-reader, and screenshot-safety notes remain pending.
- Pre-hosting readiness remains correctly blocked only by `manual_clean`.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-11 - v1.3 Role Lane UX Contract Pass

Decision:

- Treat TechSync Ops as a multi-lane SaaS workflow where every role understands
  its job, handoff partners, allowed controls, and intentional visibility
  boundaries.
- Keep deployment out of the product-maturity sequence; continue hardening
  role UX locally until the tool feels predictable for each user lane.

Changes:

- Added `ROLE_LANE_UX.md` to define the org admin, coordinator, technician,
  client, viewer, and vendor lanes.
- Added tested `getRoleLane`, `buildRoleLaneRows`, and
  `buildRoleBoundaryRows` helpers.
- Updated the work-order home queue with lane, handoff, and success context
  above the list.
- Updated the work-order detail command panel with `Can Do` and
  `Not In This Lane` boundary rows.
- Updated README, roadmap, traceability, requirements, phase status, and QA
  docs to track the lane UX maturity pass.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `16 passed tests`.
- Full client tests passed: `8 passed suites`, `55 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - Local Testing Harness

Decision:

- Remove friction from role walkthroughs by replacing repeated manual terminal
  setup and cloud credential injection with a local-first demo launcher.
- Keep Neon as an optional cloud database mode instead of the default local
  testing loop.

Changes:

- Added `LOCAL_TESTING.md` as the short runbook for local synthetic role
  walkthroughs.
- Added `docker-compose.local.yml` for local Docker Postgres and
  `.local-demo.env.example` for generated local-only credentials.
- Added `Start-TechSync-Demo.cmd` and `Stop-TechSync-Demo.cmd` as
  double-clickable Windows launchers.
- Added `scripts/local_dev.ps1` to generate local env, start local Postgres,
  run Alembic migrations, seed/reset the synthetic demo tenant, start FastAPI,
  start Expo web, open the browser, and write logs to ignored `.local-dev/`.
- Added `scripts/local_stop.ps1` to stop the locally started backend/client
  processes, optionally clear busy dev ports, and optionally stop the local
  database container.
- Updated README, phase status, QA, requirements, traceability, and roadmap so
  low-friction local testing is part of the product-maturity workflow.

Verification:

```powershell
powershell -NoProfile -Command "$null = [scriptblock]::Create((Get-Content .\scripts\local_dev.ps1 -Raw)); $null = [scriptblock]::Create((Get-Content .\scripts\local_stop.ps1 -Raw)); 'scripts parse'"
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Local default testing now avoids Neon credentials entirely; optional Neon
  setup validation still requires a real direct Postgres URL before writing
  ignored `.local-neon.env`.

## 2026-08-11 - v1.3 External Portal UX Maturity Pass

Decision:

- Make client, viewer, and vendor lanes feel like purpose-built SaaS portals
  instead of restricted versions of the internal operations workspace.
- Keep each external lane explicit about visible work, reply path, read-only
  mode, and channel boundaries.

Changes:

- Added tested portal summary helpers for client, viewer, and vendor lanes.
- Added a client/viewer/vendor portal panel above the queue with approval,
  visible-work, active-work, read-only, and reply-path context.
- Added tested communication-lane notices for internal, client-visible,
  vendor-visible, and read-only detail-page communication states.
- Updated the work-order detail communication section to name the active
  channel before messages or read-only review.
- Updated role-lane, roadmap, phase, QA, README, requirements, and traceability
  docs to record the external portal maturity pass.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `18 passed tests`.
- Full client tests passed: `8 passed suites`, `57 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-11 - v1.3 Role-Aware Queue Card Scan Pass

Decision:

- Make every visible work-order card explain why that item matters to the
  active user's lane before the detail page opens.
- Keep the shared handoff model in place while adding role-specific scan cues
  for admins, coordinators, technicians, clients, viewers, and vendors.

Changes:

- Added tested `buildRoleCardRows` helper for role-specific card cues.
- Updated work-order list cards with compact `Operational Signal`,
  `Coordination Need`, `Field Focus`, `Client Action`, `Snapshot`, and
  `Vendor Action` style rows depending on the active role.
- Added accessible labels for the new card cues and mobile-safe text wrapping.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs to track the queue-card scan expectation.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `19 passed tests`.
- Full client tests passed: `8 passed suites`, `58 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Detail Action Path UX Pass

Decision:

- Carry the role-aware queue scan into the work-order detail page so every role
  can see the next useful action across approval, communication, proof, and
  lifecycle without guessing.
- Keep the detail page predictable by naming both available actions and
  intentionally limited lanes.

Changes:

- Added tested `buildDetailActionPathRows` helper for role-specific detail
  follow-through.
- Updated the work-order detail command panel with a compact action-path grid
  for approval, communication, proof, and lifecycle.
- Added accessible labels for the action-path cues and mobile-safe wrapping.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs to track the detail action-path expectation.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `20 passed tests`.
- Full client tests passed: `8 passed suites`, `59 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Role Event Playbook UX Pass

Decision:

- Mature the work-order detail experience from static role permissions into
  recurring event handling so each SaaS user knows how to respond when common
  operating events happen.
- Start with the detail page because approval, proof, vendor updates,
  escalations, pauses, closeout, and read-only review all converge there.

Changes:

- Added tested `buildRoleEventPlaybookRows` helper for role-specific recurring
  event guidance.
- Updated the work-order detail command panel with event and response rows for
  admin, coordinator, technician, client, viewer, and vendor lanes.
- Covered approval requested, proof needed, vendor thread active, escalation,
  pause/completion/read-only review, and admin control checkpoint patterns.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs so event handling is part of the role UX maturity contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `21 passed tests`.
- Full client tests passed: `8 passed suites`, `60 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Post-Action Outcome UX Pass

Decision:

- Make successful work-order detail actions feel explicit and SaaS-grade by
  confirming what changed and what the next handoff means.
- Cover the actions users repeat most often across roles: status movement,
  messages, approval requests/decisions, and proof uploads.

Changes:

- Added tested `buildActionOutcomeNotice` helper for status, message,
  approval, and proof outcomes.
- Updated the work-order detail page with a dismissible `Last Update` panel
  after successful detail mutations.
- Removed the proof-upload success alert in favor of the same inline
  confirmation pattern used by other role actions.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs so post-action confidence is part of the role UX contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `22 passed tests`.
- Full client tests passed: `8 passed suites`, `61 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Queue Event Lane UX Pass

Decision:

- Make every role's home queue explain the recurring operating loops they own
  before they open a work order.
- Keep TechSync Ops centered on role clarity and handoffs: risk, intake,
  assignment, approval, proof, read-only review, and vendor delivery.

Changes:

- Added tested `buildRoleEventLaneRows` helper for queue-level role event cards.
- Updated the work-order home queue with role event-lane cards for org admin,
  coordinator, technician, client, viewer, and vendor users.
- Tuned event-lane cards to wrap more comfortably on narrow screens.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs so queue-level event monitoring is part of the role UX
  contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `23 passed tests`.
- Full client tests passed: `8 passed suites`, `62 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Role-Aware Queue Focus UX Pass

Decision:

- Turn the role event lanes from passive queue context into actionable focus
  filters.
- Help every user answer "what should I look at now?" without scanning the
  full queue or stepping outside their lane.

Changes:

- Added tested queue-filter helpers for org admin, coordinator, technician,
  client, viewer, and vendor operating loops.
- Updated the work-order home queue with `Work Views` chips that filter the
  visible list by risk, assignment, approval, proof, blocker, read-only, and
  vendor delivery contexts.
- Added filtered empty-state copy so an empty focus lane explains the selected
  operating loop and tells users how to return to the full visible queue.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs so queue filtering is part of the role UX contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `24 passed tests`.
- Full client tests passed: `8 passed suites`, `63 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Detail Section Readiness UX Pass

Decision:

- Reduce role confusion inside long work-order detail pages by explaining each
  section's readiness before the user reaches approval, messaging, proof, or
  lifecycle controls.
- Fix the detail jump targets while adding readiness cues so top action-path
  controls land in the section they name.

Changes:

- Added `buildDetailSectionReadinessRows` for role-aware approval,
  communication, proof, and lifecycle readiness states.
- Rendered compact readiness bands before client approval, communication,
  attachment/proof, and lifecycle controls.
- Covered client approval decisions, manager missing-client prerequisites,
  technician proof needs, viewer read-only communication, and lifecycle action
  availability in role workflow tests.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs so section-level readiness is part of the role UX contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `25 passed tests`.
- Full client tests passed.
- Backend tests passed.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Detail Action Jump UX Pass

Decision:

- Make long work-order detail pages easier to operate by turning the top
  action-path cues into direct jump controls.
- Preserve the role-lane model while reducing scroll-and-hunt friction for
  approval, communication, proof, and lifecycle work.

Changes:

- Added section targets to `buildDetailActionPathRows` for approval,
  communication, proof, and lifecycle paths.
- Updated the work-order detail command panel so action-path cards are tappable
  and scroll to the matching section.
- Styled action-path cards as interactive controls with visible `Jump` affordance
  and accessibility labels.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs so detail jump controls are part of the role UX contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `24 passed tests`.
- Full client tests passed: `8 passed suites`, `63 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - v1.3 Role Next-Best-Action Queue Tool

Decision:

- Convert the role home-queue maturity pass from passive guidance into an
  operable tool that recommends one concrete next work item for the active
  role.

Changes:

- Added `buildRoleNextBestAction`, a deterministic queue-ranking helper that
  scores visible work by role, priority, status, approval, assignment, blocker,
  and proof state.
- Updated the work-order home queue with a next-best-action panel that opens
  the recommended work order or focuses the matching queue filter.
- Kept compact outcome cards as supporting role proof, with the operable
  recommendation and buttons as the primary queue surface.
- Covered admin, coordinator, technician, client, viewer, vendor, and empty
  queue next-action selection in role workflow tests.
- Updated README, roadmap, phase status, QA, requirements, traceability, and
  role-lane docs so operable role tooling is part of the UX contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Focused role workflow tests passed: `1 passed suite`, `27 passed tests`.
- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Backend tests passed: `188 passed`.
- Python compile checks passed.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - Hosted Staging Loop Pivot

Decision:

- Move from local-only proof as the default testing posture to an active hosted
  staging loop so TechSync Ops can be reviewed from real URLs faster.
- Keep the safety boundary clear: hosted staging uses synthetic data and
  `APP_ENV=demo`; portfolio/public promotion waits for hosted smoke evidence
  and role walkthrough quality.

Changes:

- Added `HOSTED_TESTING.md` as the live staging setup guide for Vercel API,
  Vercel Expo web, Neon, and GitHub reset secrets.
- Added `client/vercel.json` and `npm run build:web` so the Expo web client can
  deploy as a static Vercel project.
- Added `.github/workflows/reset-hosted-demo.yml` so the synthetic Neon demo
  tenant can be migrated and reset from GitHub Actions without local database
  secret injection.
- Updated deployment, roadmap, phase, QA, requirements, traceability, hosting,
  and README docs so staging is an accelerator rather than a blocker, while
  public portfolio promotion remains evidence-gated.
- Ignored `client/dist/` so local Expo web export artifacts do not get tracked.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
server\venv\Scripts\python.exe -m compileall -q server scripts
git diff --check
```

Result:

- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.

## 2026-08-13 - Work Views Rail and Brand Mark Polish

Decision:

- The left rail still split the user's mental model between Navigation and
  Focus Queue, which made it less clear that the buttons change the center
  work list.
- The signed-in TechSync copyright mark needed to read as a deliberate brand
  signal rather than a weak inline symbol.

Changes:

- Replaced the left-rail Navigation/Focus Queue split with one `Work Views`
  control surface.
- Renamed the universal queue button to `All Work` and the client decision
  filter to `Decisions`.
- Added per-view `?` help bubbles so filter meaning is available on demand
  without exposing explanatory copy in the rail.
- Rebuilt the header copyright mark as a small styled circled lockup and gave
  the TechSync wordmark stronger visual weight.
- Updated README, QA checklist, command log, and role workspace layout docs to
  reflect the Work Views rail contract.

Verification:

```powershell
npm.cmd run test:ci -- roleWorkflows.test.js
```

Result:

- Role workflow helper tests passed: `1 passed suite`, `27 passed tests`.

## 2026-08-13 - Help Bubble Dismissal Polish

Decision:

- The new contextual help bubbles reduced visible copy, but clicked bubbles
  could stay open and stack over nearby UI.
- Treat the bubbles like transient contextual help: one active explanation at
  a time, click again to dismiss, and hover/focus/tap to reopen when needed.

Changes:

- Updated the shared `HintBubble` component so every help bubble shares one
  active-popover registry.
- Removed sticky pinned behavior that kept popovers visible after click.
- Rendered web help popovers through a document-level portal with measured
  viewport placement so they are not hidden by work-order cards, rails, or
  scroll panes.
- Documented the one-at-a-time, click-to-dismiss help-bubble contract.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
```

## 2026-08-13 - Role Workspace Layout Pass

Decision:

- The light palette improved comfort, but role pages still felt like stacked
  cards with equally loud sections.
- Standardize the role home UX around a calmer SaaS workspace: left Work Views
  rail, center data lane, and right next-action rail.
- Keep beige/white as the foundation, but tone it down slightly and shrink
  large pill-like controls so interaction weight matches the text.

Changes:

- Added `ROLE_WORKSPACE_LAYOUT.md` as the shared layout contract for admin,
  coordinator, technician, client, viewer, and vendor lanes.
- Reworked `WorkOrdersListScreen` into the three-zone workspace with responsive
  stacking for smaller widths.
- Softened shared palette tokens and swept existing client colors to match.
- Tightened work-order list cards and detail-page command surfaces so the UI
  feels less oversized while keeping role guidance and actions available.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
```

Result:

- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.

## 2026-08-12 - Vercel Root Requirements Parser Fix

Decision:

- Vercel failed the API build because its Python dependency parser did not
  accept the root `-r server/requirements.txt` include.
- Keep `server/requirements.txt` as the backend developer dependency list, but
  expand the same runtime dependencies directly in root `requirements.txt` for
  Vercel.

Changes:

- Replaced the root requirements include with plain Python package entries.
- Updated the Vercel runbook to explain that the root requirements file mirrors
  backend runtime dependencies for Vercel's parser.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
npm.cmd run test:ci
npm.cmd run build:web
git diff --check
```

Result:

- Backend tests passed: `188 passed`.
- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.
- `git diff --check` reported only Windows LF-to-CRLF warnings.

## 2026-08-12 - Vercel API Path Adapter Fix

Decision:

- The API deployed successfully, but `/`, `/docs`, and other public paths
  returned FastAPI `404` because the Vercel rewrite reached the function
  without preserving the expected FastAPI route path.
- Route Vercel requests through `api/index.py/$1` and strip the function prefix
  in the ASGI entrypoint before handing requests to the existing app.

Changes:

- Updated `vercel.json` to preserve the original path segment in the function
  destination.
- Added a small Vercel path adapter in `api/index.py`.
- Added a root API route that points testers to `/health`, `/docs`, and
  `/openapi.json`.
- Added a dependency-free ASGI test covering Vercel-prefixed root, health,
  docs, and OpenAPI routes.
- Updated hosted testing and Vercel runbooks with the live route checks.

Verification:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests\test_vercel_entrypoint.py -p no:cacheprovider
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Result:

- Focused Vercel entrypoint test passed: `1 passed`.
- Full backend tests passed: `189 passed`.
- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.

## 2026-08-12 - Hosted Admin Risk Focus UX Fix

Decision:

- The hosted web app logged out correctly, but the admin `Show Risk` action
  only changed the button to `Focused`, leaving testers without a visible
  explanation or reset path.
- Make queue focus explicit and reversible so the admin risk tool behaves like
  an operator-facing filter, not a silent state change.

Changes:

- Replaced the disabled `Focused` state with `Showing Risk` style language.
- Added an active focus summary with matching record count and `Clear Focus`.
- Made selected non-`All` queue chips toggle back to the full visible queue.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
```

Result:

- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.

## 2026-08-13 - Public README Front-Door Polish

Decision:

- The README had accurate project history, but the opening read like internal
  build notes instead of a public-facing product/repo front door.
- Keep the README honest about staged-demo readiness while making the first
  impression clearer for portfolio viewers, technical reviewers, and investor
  conversations.

Changes:

- Reframed the README around the product promise, problem, current readiness
  state, user lanes, live staging loop, architecture, testing, security, and
  roadmap.
- Moved detailed evidence and requirement trails into the documentation index
  instead of placing all implementation history above the fold.
- Preserved explicit boundaries that the hosted loop is synthetic-data staging,
  not real customer production.

Verification:

```powershell
Get-Content README.md -TotalCount 120
```

Result:

- README now opens with public positioning, readiness boundaries, role lanes,
  and concise links into the deeper project docs.

## 2026-08-13 - Refined Light Visual System Pass

Decision:

- The hosted web app was usable, but the dark/neon palette made long testing
  sessions visually tiring and harder to scan.
- Shift the client toward a white/light-beige operating surface with softer
  black, blue, green, yellow, and red system colors.
- Use a Roboto Serif-first web font stack with safe serif fallbacks while
  avoiding a new package or external runtime dependency.

Changes:

- Added `client/src/theme.js` with shared color and typography tokens.
- Updated app navigation, status bar, loading state, auth screens, dashboards,
  work-order flows, directory, reports, role evidence, and error states to the
  refined palette.
- Rebased report metric color constants and tests onto the same softened status
  colors so UI evidence stays consistent across roles.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
```

Result:

- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.

## 2026-08-13 - Role Workspace Rail and Story Polish

Decision:

- The light theme made the app calmer, but the left/right role rails still
  blended into the center data area and clickable cards were not obvious
  enough.
- Work-order details also needed to read more like a field-service job story:
  who requested it, where it happened, who owned it, what happened next, and
  what proof exists.

Changes:

- Added stronger muted backgrounds to the fixed navigation and next-action
  rails, plus explicit helper copy for what each rail is meant to communicate.
- Made the right next-action rail scroll internally so long guidance does not
  push the central work queue out of view.
- Added hover/pressed shading to work-order queue cards and detail jump cards.
- Added a detail-page work-story timeline covering intake, schedule,
  assignment, field work, proof/photos, and latest update.
- Updated README, QA checklist, and role workspace layout documentation with
  the new scanning and work-story contract.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
```

Result:

- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.

## 2026-08-13 - Role Workspace Help and Click Affordance Polish

Decision:

- The stronger light workspace was easier to scan, but visible explanatory
  sentences still created noise in the left rail, center portal summary, and
  right next-action rail.
- Keep the visible surface focused on actions, counts, and work records, while
  moving explanation into compact on-demand help bubbles.

Changes:

- Added compact `?` help bubbles for role navigation, queue focus, portal
  summary, next actions, detail command context, and work-story context.
- Removed always-visible helper paragraphs from the role home and detail
  headers where the screen already communicates the action directly.
- Strengthened clickable card affordances with raised resting surfaces and a
  darker pressed/hovered state for queue cards and portal panels.
- Sharpened the signed-in TechSync header brand with a larger title and small
  circled mark while keeping role/page text subordinate.
- Updated README, QA checklist, and role workspace layout docs with the
  visible-action/on-demand-help contract.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
```

Result:

- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.

## 2026-08-13 - Work Views Active Tab Simplification

Decision:

- The separate `Active Focus` panel above Work Views repeated the selected
  tab state and made the left rail noisier than it needed to be.
- Keep location feedback on the navigation control itself: the selected Work
  View should remain visibly active while the center queue changes.

Changes:

- Removed the extra active-focus summary and clear-focus panel from the left
  rail.
- Made the selected Work View button use a darker active tab treatment with
  light text and a semantic edge marker.
- Preserved the existing tap-again behavior for non-`All Work` views so users
  can still return to the full queue without a separate reset card.
- Updated QA and workspace layout docs with the selected-tab contract.

Verification:

```powershell
npm.cmd run test:ci
npm.cmd run build:web
```

Result:

- Full client tests passed: `8 passed suites`, `66 passed tests`.
- Expo web export passed and wrote the Vercel-ready build to ignored
  `client/dist`.
