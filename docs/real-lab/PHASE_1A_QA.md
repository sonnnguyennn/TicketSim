# Real Lab Phase 1A — QA and reviewer handoff

**Date:** 2026-10-29 (Asia/Saigon). **Scope:** secure mock engine and first pilot contract only. No real VM mutation was authorized or performed.

## Implemented

- Local Node agent: loopback binding, exact Host/Origin checks, one-time pairing code, expiring bearer session, explicit JSON/body/method handling, rejected WebSocket upgrades, mock-only API routes. Real environment status remains false.
- Server-owned `LAB-WEB-001` registry with schema/known action ID/target VM validation. The browser cannot submit a VM ID, setup script, shell command or action ID.
- SQLite runs/events/leases/request deduplication with versioned migration, transactional transitions, deterministic sequence, exclusive VM reference and fail-closed restart behavior. Default database is outside the repository.
- Mock VM observation, Nginx fault/setup state, independent grader and recovery contracts, full dry-run orchestration and failure paths. All returned run results are marked `simulated`.
- Read-only preflight now inventories host memory, filesystems, switches and Multipass version. Real Lab page labels the pilot mock-only and still has no Start Real Lab control.

## Tested

| Gate | Actual result | Notes |
|---|---|---|
| `npm run prepare-data` | Pass | 112 tickets, 112 Guided cases |
| `npm run audit:content` | Pass, 0 errors | 620 scored questions, 122 command cards remain in audit |
| `npm test -- --run` | **79/79**, 13 files | Auth, API origin/host/body, SQLite migration/persistence, ordering, lease concurrency, idempotency, state/failure/recovery/restart, registry, mock-only boundary and existing app tests |
| `npm run build` | Pass | Existing Vite large-chunk warning remains |
| `npm run test:browser` | **51/51** | Guided/progress regression and Real Lab unavailable navigation |
| `scripts/real-lab-preflight.ps1` | JSON emitted; `ready:false` | Windows 11 Pro build 26200, PowerShell 7.6.5 |

Tests ran with Node 25.1.0 on Windows. `node:sqlite` emitted its experimental-feature warning; the agent runtime is not qualified on the app's older supported Node versions. The browser suite was run after the Real Lab UI change; subsequent changes were confined to agent code, schema/test/documents.

## Mock only

The successful dry-run test creates a mock run, holds a mock VM lease, simulates an Nginx fault while SSH remains true, independently grades fake HTTP/config/SSH state, restores a fake baseline and releases the lease. The API's own submit test grades a still-broken fake state as failure, then recovers. Setup/fault/grader/recovery failures, duplicate requests, concurrent starts and agent restart are covered. These results do not prove real guest behavior, backup quality, recovery or security against a privileged local adversary.

## Confirmed defects and fixes from Phase 0

1. `vite.config.ts` previously included only `src/**/*.test.ts`; `agent/server.test.mjs` was **not collected**, despite the Phase 0 QA wording implying agent tests ran. Phase 1A includes `agent/**/*.test.mjs` and now executes those tests. The original test's attempted `Host` override used Node fetch, which substituted the actual port; the Host check/test now use the listener port and a raw HTTP request for spoofing.
2. `src/real-lab/mockController.ts` previously returned a snapshot from a map by lookup key without verifying the snapshot's own VM identity and returned the mutable object. It now verifies the full identity and returns a clone; regression test added.

The Phase 0 schema/lifecycle/preflight readiness helpers were design contracts, not executable safety gates. Phase 1A moves scenario and action validation, run transitions and recovery checks into the agent. No confirmed defect was found in the existing Guided terminal or progress v5 flow.

## Security findings and limits

- The agent has no `child_process`, PowerShell, Hyper-V, Multipass or SSH execution module. Mock routes require a bearer token and allowed Origin; pairing code and token are ephemeral and not written to source or SQLite. Static absence checks complement API tests but are not a general proof of security.
- A local process can spoof an Origin header; loopback/Origin alone are insufficient. Pairing-code secrecy, OS account isolation and later privileged-action review remain necessary. A future browser UI must protect its in-memory token from extensions/XSS and must not treat this mock pairing design as approval to operate VMs.
- SQLite via `node:sqlite` is experimental on the tested runtime. The agent still needs deployment-version qualification, backup/restore of its database and operational review before real actions.
- Unknown/stale leases remain blocked. Phase 1A intentionally has no HTTP reconciliation or real recovery action, so a mock run interrupted after agent restart cannot be auto-resumed.

## Blocked host evidence

Read-only preflight saw Multipass 1.16.1+win with `local.driver=hyperv` and `lab1` listed Running with IPv4 `N/A`; `multipass info` timed out. Hyper-V `Get-VM` and switch inventory returned access denied. Host memory/free-space observations are in `VM_PREFLIGHT.md`, but no VM sizing, ownership, backup or restore conclusion follows. `lab1` was not altered. Canonical documents that the Multipass `hyperv` driver becomes deprecated from 1.17; no migration was attempted. See `VM_PROVISIONING_PLAN.md`.

## Files and commits

Agent code/tests: `agent/auth.mjs`, `server.mjs`, `service.mjs`, `store.mjs`, `registry.mjs`, `lifecycle.mjs`, `mockActions.mjs`, `mockVmController.mjs`, `contracts.d.ts`, related tests. App/schema/test integration: `src/real-lab/RealLabPage.tsx`, `mockController.ts`, `model.ts`, `manifest.schema.json`, `model.test.ts`, `tests/browser.spec.ts`, `vite.config.ts`, `package.json`, `package-lock.json`. Diagnostics: `scripts/real-lab-preflight.ps1`. Documents: `README.md` and `docs/real-lab/*`. The four pre-existing untracked audit files remain untouched. Commit IDs are listed in the final reviewer report.

## Phase 1B readiness

**NO-GO.** A disposable VM, sole controller ownership, independent backup, host-side restore without guest SSH, management channel and capacity have not been verified. The PM must review these gates plus the agent security/elevation design and Ubuntu-specific pilot procedures before any real integration. Phase 1A stops here.
