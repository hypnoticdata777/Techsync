# TechSync QA Checklist

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

## Backend Local/CI Quality

- [x] GitHub Actions CI passed on latest verified `main`.
- [ ] Backend pytest suite run locally from the fresh clone.
- [ ] Alembic migration dry run or upgrade verified against a demo database.
- [ ] Production config validation reviewed for hosted deployment.

## Hosted Backend POC

- [x] Preferred database provider documented as Neon Postgres.
- [x] Cloudflare role documented as DNS/portfolio front door and preferred R2
      storage candidate.
- [x] Stripe documented as deferred for first investor POC.
- [x] Email/storage deferral tradeoffs documented.
- [ ] Backend host chosen: Vercel, Render, or Railway.
- [ ] Neon demo database created.
- [ ] Pooled Neon connection string selected for hosted/serverless runtime.
- [ ] Demo-mode vs full `APP_ENV=production` decision made.
- [ ] Host secret manager configured.
- [ ] Alembic migrations run against hosted/demo database.
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

## Client / Demo Surface

- [ ] Demo surface chosen: Expo web, hosted preview, screenshots, recording, or
      portfolio wrapper.
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to hosted backend in demo mode.
- [ ] Synthetic demo walkthrough validated.
- [ ] No real organization, user, technician, customer, work-order, location, or
      attachment data appears in public screenshots.
- [ ] Mobile/desktop screenshots captured for portfolio.

## Portfolio Integration

- [ ] TechSync project card added to portfolio.
- [ ] Problem statement added.
- [ ] Architecture/proof summary added.
- [ ] GitHub repo linked.
- [ ] Hosted demo or walkthrough linked.
- [ ] POC status label added.
- [ ] Production limitations listed honestly.

## Investor-Safe Stop Gate

- [ ] Repo is clean and pushed.
- [ ] CI passes.
- [ ] Hosted POC works with synthetic/demo data only.
- [ ] Portfolio link works.
- [ ] QA evidence is documented.
- [ ] Real customer readiness limitations are documented.
