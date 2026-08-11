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
- [x] Backend pytest suite run locally from the fresh clone.
- [x] Alembic migration dry run or upgrade verified against a demo database.
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
- [x] Repeatable v1.3 hosted smoke-test script added.
- [x] Repeatable synthetic demo seed/reset script added.
- [x] Synthetic demo data runbook added.
- [x] Manual GitHub Actions hosted smoke workflow updated for v1.3.
- [x] v1.2 evidence template added.
- [x] v1.3 evidence template added.
- [x] Portfolio case-study source copy added.
- [x] Neon demo database created.
- [x] Direct Neon connection string used for Alembic migrations.
- [x] Pooled Neon connection string selected for hosted/serverless runtime.
- [x] Demo-mode vs full `APP_ENV=production` decision made for the first hosted
      POC.
- [ ] Host secret manager configured at the end-of-v1.3 showcase gate.
- [x] Initial Alembic migration run against hosted/demo database.
- [x] Latest v1.3 Alembic migrations verified against hosted/demo database.
- [x] Synthetic demo tenant seeded or reset against hosted/demo database.
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
- [ ] `scripts/smoke_v13.py` run against hosted API and sanitized evidence
      captured.

## v1.3 PMC Product Foundation

- [x] Clients, properties, and vendors added to the database migration path.
- [x] Tenant-scoped API/repository/model foundation added for clients,
      properties, and vendors.
- [x] Mobile PMC directory workflow added for client/property/vendor create and
      edit flows.
- [x] Work orders can reference property, client, and vendor records.
- [x] Mobile work-order form can link client, property, and vendor records.
- [x] Mobile work-order form includes a before-save context review for linked
      client, property, vendor, and address state.
- [x] Backend client-visible communication separated from internal notes.
- [x] Client/homeowner UI for client-visible communication implemented.
- [x] Client approval/decline workflow implemented.
- [x] Staff-side client approval request covered by v1.3 hosted smoke harness.
- [x] DB-assisted v1.3 smoke path prepared for synthetic client invite accept
      plus accepted-client approval proof without writing raw tokens to
      evidence.
- [ ] Client invite/accept plus client-side approve/decline workflow
      smoke-tested against a migrated hosted/demo database.
- [x] Backend closeout proof requirement and manager override reason
      implemented.
- [x] Backend closeout package summary implemented.
- [x] Closeout printable HTML/text export generation implemented.
- [x] Binary closeout PDF renderer implemented for lightweight closeout
      evidence without adding a PDF dependency.
- [x] Closeout attachment JSON/CSV handoff manifest implemented so binary
      evidence portability is documented without exposing private storage
      paths or credentials.
- [x] Backend operations report added for stale work, overloaded technicians, and
      property hotspots.
- [x] Operations report CSV export implemented.
- [x] Mobile operations report view added for stale work, overloaded technicians,
      and property hotspots.
- [x] Backend dispatch board added for unassigned work, technician lanes,
      workload utilization, and SLA risk.
- [x] Dispatch board CSV export implemented.
- [x] Mobile dispatch board view added for org admins/coordinators.
- [x] Backend duplicate-warning preflight added for likely same-property/address
      and service-type work.
- [x] Mobile duplicate-warning confirmation added before manual work-order
      creation.
- [x] Client/property/vendor CSV exports implemented.
- [x] Tenant-owned JSON export implemented without password hashes, API keys,
      Stripe provider IDs, or attachment storage paths.
- [x] Mobile operations report chart bars implemented for risk mix,
      technician capacity pressure, and property hotspot activity.
- [x] Completion cycle-time reporting, mobile chart bars, and operations-report
      CSV export evidence implemented.
- [x] Work-order estimated/actual cost fields, operations cost summary,
      mobile cost chart/cards, synthetic demo cost data, and CSV export
      evidence implemented.

## Client / Demo Surface

- [ ] Demo surface chosen: Expo web, hosted preview, screenshots, recording, or
      portfolio wrapper.
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to hosted backend in demo mode after
      the end-of-v1.3 hosting gate.
- [ ] Synthetic demo walkthrough validated.
- [ ] Synthetic demo seed/reset run captured without exposing database URLs or
      provider secrets.
- [x] Role-specific work-order landing band and tested role workflow helpers
      added.
- [x] Role-aware work-order detail command panel added for status, approval,
      proof, and message summary.
- [x] Manager-only mobile screens are role-gated in navigation for
      technician/client/viewer/vendor roles.
- [x] Primary mobile API failure recovery has visible retry states for list,
      report, dispatch, directory, and detail message/attachment loads.
- [x] Backend regression tests cover client/viewer unrelated-work blocking,
      viewer client-visible message enforcement, and technician unassigned
      work/subresource blocking.
- [x] Backend regression tests cover linked-vendor work-order scoping,
      vendor-visible message enforcement, and vendor/viewer attachment
      mutation blocking.
- [x] Compact mobile touch targets and wrapping behavior have been hardened for
      primary role workflow controls before screenshot capture.
- [x] Role-specific empty queue panels are implemented and tested for manager,
      technician, client, viewer, and vendor contexts.
- [x] Role UX walkthrough manifest and evidence template prepared with
      deterministic synthetic screenshot filenames.
- [x] Role UX evidence readiness audit added for synthetic login coverage,
      screenshot plan uniqueness, safety checks, role controls, client/viewer
      privacy, technician routing, and linked-vendor scope.
- [x] Manager-only in-app Role Evidence screen added for automated readiness
      checks, role capture plan, screenshot targets, and safety checklist.
- [x] Role Evidence screen includes manual final-proof checks for each
      synthetic role, 390px/320px width comfort, screen-reader notes, and
      screenshot safety.
- [x] Local role UX smoke script prepared to exercise synthetic role login,
      role-scoped API surfaces, manager-only endpoint boundaries, viewer
      read-only behavior, and vendor attachment blocking.
- [x] Final local capture worksheet prepared in `ROLE_UX_CAPTURE_PASS.md`.
- [x] Synthetic demo seed includes admin, coordinator, client, viewer, vendor,
      and technician login users for role capture.
- [x] Work-order lifecycle now covers pause, escalate, cancel, and manager-only
      archive states with backend/mobile regression evidence.
- [x] Local/demo operations runbook added for backup, restore, export,
      lifecycle, and monitoring evidence.
- [x] Accessibility helper coverage added for work-order cards, summary
      counters, role actions, form inputs, dispatch chips, and lifecycle
      controls.
- [x] Accessibility evidence template added for manual screen-reader and
      small-width verification before hosting.
- [x] Local manual notes template and evidence-pack validation added for final
      screen-reader, small-width, role-scope, and screenshot safety proof.
- [x] Local role UX capture prep helper added to generate the ignored screenshot
      folder, manual notes copy, and capture manifest.
- [x] Role UX smoke verifies screenshot-ready seeded scenarios for manager
      lifecycle depth, technician active assigned work, client pending
      approval, viewer scope, linked vendor work, and vendor-visible messages.
- [x] Demo seed status supports `--strict` capture-readiness checks for exact
      counts, synthetic users, empty-state personas, and screenshot scenarios.
- [x] Role Evidence screen now shows the final capture preflight order,
      390px/320px/desktop viewport gates, and role-specific friction focus
      checks before screenshot capture.
- [x] Strict local evidence-pack validation now requires filled manual notes
      for every checklist item, every synthetic role, and every required
      viewport before hosting.
- [x] Local pre-hosting readiness doctor added to summarize tracked tooling,
      ignored local evidence artifacts, smoke status, screenshot inventory,
      manual notes, and evidence summary blockers before the final hosting
      gate.
- [x] Role UX smoke stale-seed diagnosis added so blocked quiet viewer/vendor
      empty-state evidence points to the seed reset and strict-status recovery
      path.
- [x] Failed role smoke CLI output now prints failed checks and stale-seed
      recovery guidance inline.
- [x] Capture prep and readiness doctor now name exact missing
      role/screen/filename screenshot rows before the final manual evidence
      pass.
- [x] Required local role screenshot filenames are present in
      `local-role-ux-evidence`, including admin create-work, viewer empty
      snapshot, and vendor empty snapshot.
- [x] Expo web logout clears the current session immediately for role capture;
      native/mobile still keeps the confirmation prompt.
- [x] Role landing now locates the active user with a role badge, visible
      scope, next-move guidance, and privacy/operations guardrail copy before
      queue interaction.
- [x] Work-order details now show role-aware scope, current action, and
      guardrail guidance for admin, coordinator, technician, client, viewer,
      and vendor users before approval, messaging, proof, or lifecycle actions.
- [x] Work-order create/edit form now shows linked/manual intake guidance before
      save so client, property, vendor, and address context gaps are explicit.
- [x] Work-order queue cards and detail command panels now show
      interoperability cues for next owner, waiting-on state, and visible
      audiences so role handoffs are understandable before opening or mutating
      work.
- [x] Role UX capture prep now repairs stale local manual-notes files to the
      current checklist/role/viewport schema, and the local screenshot
      inventory reports all 21 expected images present.
- [x] Synthetic empty-state display names use no-work personas while preserving
      stable `quiet-*` login emails for repeatable role proof.
- [ ] Exhaustive role-by-role UI/UX friction sweep completed before hosting.
- [x] `scripts/smoke_role_ux.py` run against a local/demo API and sanitized
      `role-ux-smoke-evidence.json` reviewed.
- [ ] Role Evidence screen opened locally as a manager and used to drive the
      final capture pass.
- [ ] `local-role-ux-manual-notes.json` filled from
      `ROLE_UX_MANUAL_NOTES_TEMPLATE.json` and included in the final local
      evidence pack with checklist, role, and viewport notes.
- [x] `local-role-ux-capture-manifest.md` generated and used to close all
      screenshot rows before strict evidence-pack validation.
- [ ] `role-ux-evidence-summary.json` generated locally and shows no
      screenshot/manual blockers before hosting.
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
