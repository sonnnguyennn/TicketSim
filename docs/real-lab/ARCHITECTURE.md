# Real Lab architecture decision record

**Status:** Phase 1B-0 profile and endpoint contract, 2026-10-29. No executable real-VM lab is enabled. The Phase 0 and 1A descriptions below are historical implementation records.

Current provisioning decision: Gate A accepted; Gate B not authorized. PM prefers manual Hyper-V Manager/VMConnect installation from verified Ubuntu Server22.04.5 ISO into a new independent VHDX. Existing prepared-VHDX scripts are optional advanced tooling; no automated ISO installation or new mock layer is introduced. See VM_PROVISIONING_RUNBOOK.md and GATE_B_AUTHORIZATION_CHECKLIST.md. This operational choice does not enable real agent execution or weaken recovery gates.

## Repository boundary

TicketSim is a Vite/React SPA. `src/App.tsx` owns navigation and loads 112 public tickets and 112 Guided cases. `src/guided/GuidedWorkspace.tsx` calls `classifyGuidedCommand` in `src/guided/engine.ts`; that function matches authored probes and never executes host commands. `src/storage.ts` owns browser progress v5, including import/export and migration. `scripts/prepare-data.mjs` and `scripts/prepare-guided.mjs` generate public JSON from authored source (`starter-data/`, `scripts/guided-content.mjs`, `scripts/content/`). `scripts/audit-content.mjs` freezes important content invariants. Current tests are Vitest and Playwright. These components remain separate from Real Lab.

## Decision

Real Lab gets its own `src/real-lab/` module and a separate local agent. Phase 0 added a navigation destination, an honest unavailable landing page, versioned `LabScenario`/`LabRun` contracts, a lifecycle transition function, a read-only `VmController` interface and mock, and a read-only agent status endpoint. The example manifest in tests was **schema data only**.

The local agent binds `127.0.0.1:4174`. Phase 1A added authenticated mock-only run routes and SQLite run/event/lease state; the Phase 0 status-only endpoint is no longer the whole API. The frontend does not store Real Lab runs in progress v5. The frontend treats server state as authoritative; an interrupted run becomes `recovery_required` with a blocked VM lease. No real host reconciliation or mutation controller exists.

## Future control plane (not implemented)

```text
React Real Lab UI → authenticated local agent → scenario allowlist / run state
                                              ├─ grader + event store
                                              ├─ guest SSH/PTy (learner terminal)
                                              └─ exactly one VM lifecycle controller
                                                   ├─ Hyper-V, or
                                                   └─ Multipass
```

The learner terminal will be a guest SSH session, never a PowerShell host endpoint. Setup, fault verification, grading and rollback are distinct allowlisted action/check IDs in each versioned manifest. A manifest is rejected for unknown schema versions, missing checks, absent recovery policy or free-form script fields. Before Phase 1 these IDs need a server-owned registry and signed/reviewed mapping; the current TypeScript validation does not execute them. `LabRun` is deliberately separate from Guided progress. The minimal state machine models normal and recovery paths but does not itself authorize VM actions.

## Trade-offs and acceptance gates

- A separate agent adds installation and local authentication work, but keeps host capabilities outside the browser bundle. Loopback binding alone is insufficient authentication.
- Hyper-V and Multipass both appear on the target host. A VM must have one confirmed owner; a VHD path is only a clue. Never use both lifecycle APIs for the same VM.
- `lab1` is not disposable by default. No real Start Lab appears until a separate lab VM, backup, host-side recovery and fault/grade checks have been demonstrated.
- A browser terminal is deferred. An external SSH client may be simpler for the first active pilot; either option must preserve independent host recovery.
- Browser progress v5 remains untouched. Real runs require durable event sequence, timestamps, evidence and recovery state before any real action is allowed.

## Phase 1A implementation decision

`agent/server.mjs` remains loopback-only. It now supports one-time local pairing, a short-lived bearer session, strict Origin/Host checks and mock-only run routes. The server owns a single validated registry entry, `LAB-WEB-001`; the HTTP body can select its ID but cannot provide a VM ID, script, check ID or command. `MockVmController` supplies simulated VM observations; setup/fault actions, independent grader and recovery are separate injectable contracts (`agent/contracts.d.ts`) backed by in-memory mocks. No Hyper-V, Multipass, SSH or child-process implementation is loaded by the agent. The frontend shows the pilot as mock-only and has no Start Real Lab control.

`agent/store.mjs` uses SQLite via Node's built-in `node:sqlite` (tested on Node 25.1.0). It stores runs, ordered events, request deduplication and one exclusive lease per VM reference. Schema versions 1 and 2 migrate using `PRAGMA user_version`; version 2 adds request deduplication. State/event updates and lease release are transactions. On agent restart, active leases become `unknown` and nonterminal runs become `recovery_required`; no simulated success is inferred from process restart. The default database resides under the user's local application data directory, outside the repository.

The backend lifecycle is authoritative for mock runs: `preflight → baseline_ready → injecting → ready → running → submitting → graded → restoring → verified_clean → completed`, with `failed_setup`, `failed_grading`, `restore_failed` and `recovery_required` branches. The Phase 0 TypeScript lifecycle helper remains a frontend contract/prototype; it does not authorize host actions. A successful mock run proves only that orchestration and persistence logic execute against fake state.

**Trade-off:** built-in SQLite avoids a native npm package, but Node 25.1.0 still labels `node:sqlite` experimental. The SPA remains compatible with its prior Node range; the local agent requires a runtime with `node:sqlite` and must be qualified on the chosen deployment version before Phase 1B. The registry/schema v1 is only a mock contract and must not be reinterpreted as a real action manifest. A separate reviewed schema/registry revision is required for live operations.

See [DATABASE_API.md](DATABASE_API.md), [LAB_WEB_001_SPEC.md](LAB_WEB_001_SPEC.md) and [PHASE_1A_QA.md](PHASE_1A_QA.md).

## Phase 1B-0 dual-NIC profile decision

`agent/vm-profile.schema.json` and `agent/vmProfile.mjs` define a backend-owned profile and pure endpoint verifier. They separate immutable Hyper-V VM ID and lifecycle controller from the static management NIC (`eth1`, address, MAC, switch identity) and dynamic/default NIC (`eth0`). An observed dynamic address is context, never a stable SSH target. Connectivity, SSH host identity/authentication, disposable approval, scenario allowlist and independently verified recovery are distinct checks. Missing evidence is `unknown`; it cannot produce a ready result. No host collector supplies these observations in this phase. Only the synthetic mock profile is bound to the mock registry; `lab1` is a protected reference profile. The real-run verdict is always false.

**Current VERIFIED (operator elevated evidence):** lab1 eth0 MAC `525400563E97` maps to Default Switch (Internal, `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444`); eth1 MAC `5254009B8693` maps to Lab-Static (Internal, `4277a35c-217f-4096-a1a9-a691975f150f`). Host Lab-Static MAC `00155D380100`, host `10.77.77.1/24`, guest management `10.77.77.2/24`; Windows SSH login previously confirmed. The backend reference profile now records this verified switch mapping; it remains protected and reference-only. Historical permission denials refer to the non-elevated Codex context. SSH host key identity, reboot persistence, lifecycle ownership and host-side restore remain UNKNOWN. Gate A is accepted; Gate B is not authorized. See [HOST_INVENTORY.md](HOST_INVENTORY.md), [NETWORK_DESIGN.md](NETWORK_DESIGN.md) and [GATE_B_AUTHORIZATION_CHECKLIST.md](GATE_B_AUTHORIZATION_CHECKLIST.md).
