# Real Lab Phase 0 — architecture decision record

**Status:** foundation only, 2026-10-29. No executable lab is enabled.

## Repository boundary

TicketSim is a Vite/React SPA. `src/App.tsx` owns navigation and loads 112 public tickets and 112 Guided cases. `src/guided/GuidedWorkspace.tsx` calls `classifyGuidedCommand` in `src/guided/engine.ts`; that function matches authored probes and never executes host commands. `src/storage.ts` owns browser progress v5, including import/export and migration. `scripts/prepare-data.mjs` and `scripts/prepare-guided.mjs` generate public JSON from authored source (`starter-data/`, `scripts/guided-content.mjs`, `scripts/content/`). `scripts/audit-content.mjs` freezes important content invariants. Current tests are Vitest and Playwright. These components remain separate from Real Lab.

## Decision

Real Lab gets its own `src/real-lab/` module and a separate local agent. Phase 0 adds a navigation destination, an honest unavailable landing page, versioned `LabScenario`/`LabRun` contracts, a lifecycle transition function, a read-only `VmController` interface and mock, and a read-only agent status endpoint. The example manifest in tests is **schema data only**. No manifest is registered for execution.

The local agent binds `127.0.0.1:4174`; it exposes only `GET /api/v1/status` and always reports `environmentReady: false`. The frontend does not store Real Lab runs in progress v5. Agent state and scoring will need durable server-side storage when actions exist. SQLite with an append-only event table and a per-VM exclusive lock is the proposed next-phase choice; no SQLite database exists yet. The frontend must treat server state as authoritative, and the agent must reconcile interrupted runs against host VM state before proceeding.

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
