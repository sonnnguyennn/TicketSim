# Real Lab Phase 0 — QA and handoff

**Date:** 2026-10-29 (Asia/Saigon). **Scope:** foundation only. Phase 1 requires Product Owner/technical review.

## A. Implemented

- Real Lab navigation and landing page with explicit unavailable state; optional read-only agent check; no Start Lab action or SSH terminal.
- Versioned TypeScript scenario/run/preflight types, JSON Schema v1, manifest validation, lifecycle transition function and read-only mock VM controller.
- Node loopback agent skeleton with one fixed read-only status route; no browser-to-host execution endpoint.
- Windows PowerShell read-only preflight for Hyper-V and Multipass observations.
- Architecture, security, preflight and content triage documents.

## B. Files changed

`src/App.tsx`, `src/styles.css`, `src/real-lab/*` add isolated UI/contracts/tests. `agent/server.mjs` and `agent/server.test.mjs` add the loopback status boundary. `scripts/real-lab-preflight.ps1` collects host observations. `tests/browser.spec.ts` checks navigation and progress preservation. `package.json` adds a manual status-agent launcher. `README.md` and `docs/real-lab/*` document scope, decisions and evidence. No Guided engine, authored content, answer key, ticket source or progress schema was modified; generated files are unchanged after preparation.

## C. Verification

| Check | Result | Environment |
|---|---|---|
| Baseline `npm test -- --run` | 46/46 passed before edits | Windows, Node 25.1.0 |
| `npm run prepare-data` and `npm run audit:content` | 112 tickets, 112 Guided, 122 cards, zero content errors | Windows |
| Final `npm test -- --run` | 50/50 passed; includes schema, transition, controller and agent tests | Windows, Node 25.1.0 |
| `npm run build` | Passed; existing Vite large-chunk warning | Windows |
| `npm run test:browser` | 51/51 passed; includes new Real Lab navigation/progress regression | Chromium via Playwright |
| Read-only preflight | JSON emitted, `ready: false`; VM-level fields unknown where access denied | Windows 11 Pro build 26200, PowerShell 7.6.5 |

## D. Findings with evidence

- **Confirmed environment mismatch:** `TicketSim_112_Ticket_Lab_Triage.csv` classifies 104 tickets as CentOS Stream 9 and eight as N/A; none are authored for Ubuntu 22.04. `src/guided/commands.ts:40-42` names the `sshd` versus `ssh` unit difference. These are portability limits, not Guided bugs.
- **Confirmed access limit:** `Get-VM lab1` returned a permission error, while Multipass reports the instance Running with IPv4 `N/A` and `multipass info` timed out. See `VM_PREFLIGHT.md`. Running is not a readiness or recovery claim.
- **Confirmed content verification gap:** `TicketSim_122_Command_Audit.csv` has 71 source-verified, 31 pending, 20 SOP-required cards and 122 lab-pending cards. No Real Lab scenario is approved for execution.
- **No confirmed new answer-key defect** in this Phase 0 review. Watchlist flags are screening signals only; see `CONTENT_TRIAGE.md`.

## E. Limitations

The current user context cannot read Hyper-V VM details. `lab1` ownership, VHD attachment, checkpoints, capacity, guest health and independent host recovery remain unverified. No VM change, backup, checkpoint, fault injection, SSH session, lab grading, SQLite persistence or real run was performed. The local agent is a status skeleton, not a secure production control plane; authentication and action registry are future gates.

## F. Required before Phase 1

Confirm dedicated disposable VM and a sole Hyper-V **or** Multipass controller; inspect/record baseline and external backup; demonstrate host-side restore without guest SSH; verify resource budget and management connectivity; author Ubuntu-specific setup/fault/grade/rollback checks; add authenticated agent sessions, durable run/event storage and per-VM exclusion; review security and pilot content with the Product Owner/technical reviewer. `lab1` remains out of scope for mutation.

## G. Git

The repository had Git history (`master` at `0ab743b` before Phase 0). Four pre-existing untracked audit files were preserved: `TicketSim_112_Ticket_Lab_Triage.csv`, `TicketSim_122_Command_Audit.csv`, `TicketSim_Architecture_Content_Audit_2026-10-28.md`, `TicketSim_Question_Review_Watchlist.csv`. Phase 0 commit IDs are reported in the final response after commits are created.
