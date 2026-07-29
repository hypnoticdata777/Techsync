# TechSync Ops QA Checklist

This checklist tracks evidence for public POC readiness. Mark items only after
they have been verified in the relevant environment.

## Repo and Public Safety

- [x] Fresh clone has `.git` history.
- [x] `main` is aligned with `origin/main`.
- [x] Latest verified CI run on `main` succeeded for `3c3f0ac`.
- [x] `.gitignore` excludes `.env`, generated packages, build folders, logs,
      caches, and native signing artifacts.
- [x] Local env/artifact scan found no tracked `.env`, DB, SQLite, PDF, CSV,
      zip, APK, AAB, private key, or production key file.
- [x] High-signal secret-pattern scan found placeholder/docs/test values only.
- [x] Tracked Python bytecode files removed from the repo.
- [x] Independent Gitleaks `8.30.1` current-tree scan completed with no leaks
      using `.gitleaks.toml`.
- [x] Independent Gitleaks `8.30.1` full-history scan completed with no leaks
      using `.gitleaks.toml`.
- [x] Older docs reviewed for stale Supabase or single-tenant language before
      portfolio launch.
- [x] All 10 PMC operations requirement batches captured in
      `TECHSYNC_OPS_REQUIREMENTS.md`.
- [x] Requirement coverage mapped in `TECHSYNC_OPS_TRACEABILITY.md`.
- [x] v1.2/v1.3 roadmap captured in `PRODUCT_ROADMAP.md`.

## Backend Local/CI Quality

- [x] GitHub Actions CI passed on latest verified `main`.
- [ ] Backend pytest suite run locally from the fresh clone.
- [ ] Alembic migration dry run or upgrade verified against a demo database.
- [ ] Production config validation reviewed for hosted deployment.

## Hosting-Ready Foundation

- [x] Preferred database provider documented as Neon Postgres.
- [x] Cloudflare role documented as DNS/portfolio front door and preferred R2
      storage candidate.
- [x] Stripe documented as deferred for first investor POC.
- [x] Email/storage deferral tradeoffs documented.
- [x] Code-supported `APP_ENV=demo` hosted POC mode added.
- [x] Eventual backend host chosen: Vercel.
- [x] Vercel deployment adapter and runbook added, with deployment deferred to
      the end of v1.3.
- [x] Repeatable v1.2 hosted smoke-test script added.
- [x] Manual GitHub Actions hosted smoke workflow added.
- [x] v1.2 evidence template added.
- [x] Portfolio case-study source copy added.
- [x] Neon demo database created.
- [x] Direct Neon connection string used for Alembic migrations.
- [x] Pooled Neon connection string selected for hosted/serverless runtime.
- [x] Demo-mode vs full `APP_ENV=production` decision made for the first hosted
      POC.
- [ ] Host secret manager configured at the end-of-v1.3 showcase gate.
- [x] Alembic migrations run against hosted/demo database.
- [ ] `/health` verified over HTTPS.
- [ ] CORS verified against the intended demo client origin.
- [ ] Onboarding flow verified.
- [ ] Login and refresh flow verified.
- [ ] Work-order creation verified.
- [ ] Technician assignment verified.
- [ ] Status transition verified.
- [ ] CSV ingestion verified with synthetic file.
- [ ] Dashboard metrics verified.
- [ ] Attachment upload verified if object storage is configured.
- [ ] Stripe webhook verified if Stripe test-mode demo is enabled.

## v1.3 PMC Product Foundation

- [x] Clients, properties, and vendors added to the database migration path.
- [x] Tenant-scoped API/repository/model foundation added for clients,
      properties, and vendors.
- [x] Work orders can reference property, client, and vendor records.
- [x] Backend client-visible communication separated from internal notes.
- [ ] Client/homeowner UI for visible communication implemented.
- [ ] Closeout proof requirement and manager override reason implemented.
- [ ] Reporting expanded for stale work, overloaded technicians, and property
      hotspots.

## Client / Demo Surface

- [ ] Demo surface chosen: Expo web, hosted preview, screenshots, recording, or
      portfolio wrapper.
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to hosted backend in demo mode after
      the end-of-v1.3 hosting gate.
- [ ] Synthetic demo walkthrough validated.
- [ ] No real organization, user, technician, customer, work-order, location, or
      attachment data appears in public screenshots.
- [ ] Mobile/desktop screenshots captured for portfolio.

## Portfolio Integration

- [x] TechSync Ops portfolio case-study shell prepared in repo.
- [x] Problem statement drafted.
- [x] Architecture/proof summary drafted.
- [ ] GitHub repo linked.
- [ ] Hosted demo or walkthrough linked after v1.3 workflows are robust enough
      to show.
- [ ] POC status label added.
- [ ] Production limitations listed honestly.

## Investor-Safe Stop Gate

- [ ] Repo is clean and pushed.
- [ ] CI passes.
- [ ] Hosted POC works with synthetic/demo data only.
- [ ] Portfolio link works.
- [ ] QA evidence is documented.
- [ ] Real customer readiness limitations are documented.
