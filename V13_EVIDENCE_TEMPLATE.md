# TechSync Ops v1.3 Evidence Template

Use this file when the v1.3 hosted demo is deployed or when the same smoke path
is run against a local API connected to the Neon demo database. Keep all values
synthetic. Do not paste bearer tokens, passwords, database URLs, or provider
secrets into this file.

## Run Metadata

- Date:
- Environment:
- API base URL:
- Git commit:
- Database target:
- Operator:

## Database Migration Evidence

Command:

```powershell
alembic upgrade head
alembic current
```

Expected:

```text
0005 (head)
```

Observed:

```text
PASTE SANITIZED OUTPUT HERE
```

## Synthetic Demo Seed Evidence

Command:

```powershell
python scripts\seed_demo_data.py seed --reset-existing
python scripts\seed_demo_data.py status
```

Expected:

```text
Demo org slug: techsync-ops-demo-pmc
users: 6
technicians: 3
clients: 2
properties: 3
vendors: 2
work_orders: 5
```

Observed:

```text
PASTE SANITIZED OUTPUT HERE
```

## Hosted Smoke Command

Local:

```powershell
python scripts\smoke_v13.py --base-url "https://YOUR-HOSTED-API" --output v13-smoke-evidence.json
```

GitHub Actions:

```text
Actions -> Hosted v1.3 smoke test -> Run workflow -> base_url=https://YOUR-HOSTED-API
```

## Smoke Result

- Result:
- Evidence artifact/file:
- Number of checks:
- Failure notes, if any:

## v1.3 Coverage

- [ ] Health endpoint returned `ok`.
- [ ] Synthetic organization onboarding succeeded.
- [ ] Admin login succeeded.
- [ ] Synthetic client record created.
- [ ] Synthetic property record created and linked to client.
- [ ] Synthetic vendor record created.
- [ ] Client CSV export rendered.
- [ ] Property CSV export rendered.
- [ ] Vendor CSV export rendered.
- [ ] Synthetic technician record created.
- [ ] Work order created with client/property/vendor links.
- [ ] Duplicate-warning preflight detected likely repeated work.
- [ ] Manual technician assignment succeeded.
- [ ] Internal work-order message created.
- [ ] Client-visible work-order message created.
- [ ] Client-visible message filter returned only client messages.
- [ ] Staff approval request created pending approval state.
- [ ] Technician login succeeded.
- [ ] Status moved to `in_progress`.
- [ ] Synthetic proof metadata attached.
- [ ] Status moved to `completed` only after proof.
- [ ] Closeout package returned proof, messages, attachments, and audit context.
- [ ] Text closeout export rendered.
- [ ] HTML closeout export rendered.
- [ ] PDF closeout export rendered.
- [ ] Operations report endpoint returned stale/overloaded/hotspot/completion
      cycle buckets.
- [ ] Operations report CSV export rendered completion cycle evidence.
- [ ] Dispatch board endpoint returned summary, unassigned queue, and
      technician lanes.
- [ ] Dispatch board CSV export rendered.

## Manual Hosted Follow-Up

- [ ] Accept a synthetic client invitation from the hosted email/log path.
- [ ] Log in as that synthetic client.
- [ ] Verify client can only see linked client work orders.
- [ ] Verify client can only see/add client-visible messages.
- [ ] Verify client can approve or decline a pending approval request.
- [ ] Capture sanitized screenshots for the portfolio sliver.

## Safe Evidence Notes

- No real customer, property, vendor, technician, location, or attachment data
  was used.
- No credentials, tokens, database URLs, provider secrets, or private keys were
  pasted into documentation.
- Any generated JSON evidence was reviewed before sharing.
