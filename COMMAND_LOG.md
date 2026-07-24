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
- `Techsync_SaaS_Requirements.md` still listed Supabase and React Native CLI in
  the reference stack.
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
