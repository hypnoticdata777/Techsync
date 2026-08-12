# TechSync Ops Local Testing

This is the low-friction path for testing TechSync Ops like a product.

Default mode uses a local Docker Postgres database with fixed local-only
credentials. It does not require copying Neon URLs, pasting secrets, or manually
starting two terminals.

## Start The Demo

Double-click:

```text
Start-TechSync-Demo.cmd
```

Or run from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1 -ResetDemo
```

What it does:

- Creates ignored `.local-demo.env` with local-only values.
- Starts local Postgres on `127.0.0.1:55432` through Docker.
- Runs Alembic migrations.
- Resets only the synthetic `techsync-ops-demo-pmc` organization.
- Starts FastAPI on `http://127.0.0.1:8000`.
- Starts Expo web on `http://localhost:19006`.
- Opens the local web app.
- Writes logs to `.local-dev/`.

## Stop The Demo

Double-click:

```text
Stop-TechSync-Demo.cmd
```

Or run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_stop.ps1 -AlsoDatabase
```

If a previous run left a port busy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_stop.ps1 -AlsoPorts -AlsoDatabase
```

## Demo Logins

Password: `DemoPass123!`

- `admin.demo@demo.techsyncops.dev`
- `coordinator.demo@demo.techsyncops.dev`
- `client.demo@demo.techsyncops.dev`
- `owner-group.demo@demo.techsyncops.dev`
- `apex.demo@demo.techsyncops.dev`
- `lena.tech@demo.techsyncops.dev`
- `marco.tech@demo.techsyncops.dev`
- `priya.tech@demo.techsyncops.dev`
- `quiet-owner.demo@demo.techsyncops.dev`
- `quiet-vendor.demo@demo.techsyncops.dev`

## Optional Neon Mode

Use this only when you intentionally want to test against the cloud demo
database.

One-time setup:

1. In Neon, copy the `DIRECT` connection string with the password visible.
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1 -SetupNeonEnv
```

Start against Neon:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1 -UseNeon -ResetDemo
```

This writes `.local-neon.env`, which is ignored by git.

## Useful Variants

Start without reseeding:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1
```

Start backend only:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1 -BackendOnly
```

Start client only:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1 -ClientOnly -NoMigrate -NoSeed
```
