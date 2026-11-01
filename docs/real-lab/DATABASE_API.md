# Phase 1A mock database and local API

## B5 live extension — staged

SQLite schema v3 adds `mode` (`mock` or `real`) and bounded `evidence_note` to run rows. Existing v1/v2 runs migrate in place with mode `mock`; Guided progress is separate and unchanged. Real events set `simulated:false`; the event log records fixed check/operation IDs and pass/fail/unknown, never SSH output or secrets. Agent restart marks an active real run `recovery_required` and keeps its VM lease unknown. Only verified reset completion releases the lease.

When and only when a validated B5 proof and distinct trial approval are configured, authenticated `/api/v1/live-runs` GET/POST, `/api/v1/live-runs/<uuid>` GET, and `/api/v1/live-runs/<uuid>/submit` POST become available. Start accepts exactly `{ "scenarioId": "LAB-WEB-001" }`; submit accepts exactly `{ "verificationNote": "..." }` (up to 1000 characters). Both writes require the existing bearer, permitted Origin, JSON and idempotency key. Neither accepts VM IDs, scripts, SSH commands, action IDs or checkpoint IDs. The separate operator server at `127.0.0.1:4175` accepts only its own token and fixed inspect/reset operation IDs. See [operator procedure](B5_LAB_WEB_001_OPERATOR.md).

The Phase 1A mock-only description below is retained as historical documentation.

## Runtime and storage

Run `npm run real-lab:agent` with Node 25.1.0 (the version used for QA). The agent binds `127.0.0.1:4174` and uses Node's experimental built-in `node:sqlite`. Its default database is `%LOCALAPPDATA%\TicketSim\real-lab\runs.sqlite` on Windows, or `~/.local/share/TicketSim/real-lab/runs.sqlite` elsewhere. Do not put the database in `src/data`, `public`, `dist` or Git. The tests use `:memory:` and temporary databases.

Schema v1 has `lab_runs`, `lab_events` and `vm_leases`; schema v2 adds `request_dedup`. The current version is `PRAGMA user_version = 2`. Migration from v1 is tested; a future version is rejected. A run row has run/scenario/version/VM identity, phase, recovery status, creation/start/completion/update timestamps, event sequence, error and grade status. Events use `(run_id, sequence)` as a primary key; SQLite transactions make phase and event changes atomic. `vm_leases.vm_ref` is unique. A terminal run releases a lease only after mock baseline verification. Restart marks active leases unknown and active runs recovery-required; no automatic cleanup or success claim occurs.

## API contract

All responses use JSON and `Cache-Control: no-store`. Only `GET /api/v1/status` and `GET /api/v1/scenarios` are public. Status always reports `environmentReady:false`, `vmVerified:false`, `actionsEnabled:false`; the catalog says `mode:mock-only` and `availableForRealVm:false`. The other routes require a bearer token. `POST` routes also require an allowed Origin and `Content-Type: application/json`.

| Route | Body | Effect |
|---|---|---|
| `POST /api/v1/pair` | `{ "code": "<operator's one-time terminal code>" }` | Returns a 15-minute bearer token. Allowed local Origin required. |
| `GET /api/v1/mock-runs` | none | Returns simulated run rows, authenticated. |
| `POST /api/v1/mock-runs` | `{ "scenarioId": "LAB-WEB-001" }` | Requires bearer and `Idempotency-Key` (16–128 safe characters). Starts only mock orchestration. |
| `GET /api/v1/mock-runs/<uuid>` | none | Returns one simulated run with ordered events, authenticated. |
| `POST /api/v1/mock-runs/<uuid>/submit` | `{}` | Requires bearer and a new idempotency key. Grades fake state and runs fake recovery. |

Allowed browser Origins are exact local Vite/preview origins configured in `agent/server.mjs`. A CLI client must explicitly send one of those Origins when pairing or writing; this header is a CSRF control for browsers, while the pairing code and bearer token authenticate the caller. No endpoint accepts VM ID, command text, script text or arbitrary action ID. The mock learner repair helper is internal to tests and is not an HTTP route. Duplicate keys return the existing run without repeating a transition; reusing a key for a different operation is rejected.

The API returns database-style snake_case fields in Phase 1A. A future frontend run view should introduce a versioned response DTO before relying on these fields. No active run can be resumed after an agent restart until an operator reconciliation path is designed and independently tested.
