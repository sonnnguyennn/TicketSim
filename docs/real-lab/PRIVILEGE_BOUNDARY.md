# Phase 1B-1 Gate A privilege boundary

## Gate B readiness closure — actual source re-review

Gate A is ACCEPTED at 2414d19, Gate B still NOT AUTHORIZED. Re-read Invoke-Operator.ps1, HyperV.Operator.psm1 and example config directly. New mapping evidence changes only the lab1 reference profile and example's topology verification flag. Disposable/IP approval flags remain false; real agent readiness remains false. Source-level evidence in current HyperV.Operator.psm1:

| Control | Actual implementation evidence |
|---|---|
| Protected name/immutable lab1 ID | Lines3,31: fixed protected ID; only ticketsim-lab name permitted |
| Approved sizing, paths and source | Lines34–43: fixed2GiB/max20GiB, canonical path/overlap checks, source SHA256 and attachment check; no approved local source exists yet |
| No overwrite or ambiguous target | Lines52–56: existing VM/path/drill collision rejection, exact ID and Off state; line154 File.Copy(...,false); per-target attached disk root check before action |
| Separate backup | Lines60–78: budget aggregation and backup exclusion by volume UniqueId; this does not alone establish physical/offline protection |
| Persisted journal | Lines80–87: CreateNew/Append and Flush(true); created/imported ID journaled at159/196; ACLs remain operator responsibility |
| Explicit approval and interrupted state | Line129 exact operation/request approval; lines130–137 persistent lease/request; lines200–202 awaiting-verification or failed-quarantined plus journal, no automatic release/cleanup |
| New restore identity and isolation | Lines191–196: Compare-VM Copy/GenerateNewId, disconnect report NICs before Import-VM, reject original/protected ID, record new ID; no Start-VM call |
| No arbitrary execution | Entry point reads operator JSON and calls fixed module operations; no expression evaluation, shell runner or browser/agent import. Existing HTTP API remains mock-only |

These are inspected implementation paths, not successful real Hyper-V tests. No apply/real VM command ran. Existing syntax/synthetic/mocked tests support source review only; actual Gen2 boot, import compatibility and restore are still untested. Gate B proposal lists image preparation and subsequent VM/backup/drill operations separately. On interruption, reconcile actual state before any approved lease archival; retain original backup and journal. No cleanup of unrelated resources is provided.

Relevant verification for this closure: `npx vitest run agent/vmProfile.test.mjs scripts/operator-safety.test.mjs` passed15/15 in2 files, including24 PowerShell harness assertions. This verifies the now-known management switch mapping while lab1 stays reference-only/unapproved for execution. No new mock layers/UI or policy lowering. Full unit/build/browser results from Gate A closure remain historical and were not rerun for this backend-data/documentation-only change.

## PM review safety fixes

Code review found Windows ADS/device/alias path forms were insufficiently rejected; backup independence relied on drive letters; journal rewrites could truncate prior evidence; backup validation did not bind the exact baseline fingerprint; partial restore identity was recorded after rename. These are fixed: reject nonordinary paths and traversal/alias segments, group capacity by actual volume UniqueId and reject backup sharing VM/drill volume, use create-new then append-only JSON-lines journal with Flush(true), bind baseline fingerprint and record created/imported identity before later configuration/rename. Recheck capacity under lease. Provisioning explicitly disables Dynamic Memory. Restore selects the source VM's root vmcx by immutable ID, excluding checkpoint configuration files. Historical implementation descriptions below are supplemented by these changes.

Journals retain `.json` filenames for replay protection but contain one complete JSON snapshot per line. A crash can leave an incomplete final line; earlier flushed records and the persistent lease remain evidence, never automatic permission to retry. Failure after a VM command but before its result was journaled still requires inventory reconciliation. Journals and configuration need operator-controlled ACLs. No automatic cleanup/release was added. Safety tests cover file and mocked state behavior; they do not qualify Hyper-V cmdlet behavior, controller authorization, power-loss durability or recovery on the actual host.

The non-administrator local agent remains mock-only. Reviewed `03910ee`: its HTTP API accepts scenario IDs and idempotency keys, never commands/VM IDs; the registry binds a synthetic VM; unknown endpoint/recovery observations block a run. The protected lab1 ID and reference-only profile cannot authorize a fault. Guided and Objective Exam remain fixture-based and separate.

`scripts/real-lab/Invoke-Operator.ps1` is an **offline operator tool**, not imported by the agent or exposed over HTTP. Fixed operations: provision, checkpoint, reset, backup, restore-copy. Default is read-only planning. Future apply requires `-Apply` plus exact text `APPROVE GATE B <operation> <requestId>` after explicit Product Owner approval. This text records operator intent; it is not cryptographic authorization or a substitute for PO approval. Gate A does not grant that approval. Only an operator with Hyper-V rights may run approved apply operations. Do not elevate the agent.

Store reviewed configuration and StateRoot under administrator-controlled ACLs, outside writable browser assets and shared folders. They are trusted operator inputs; an account that can alter them can alter future operation intent. Code rejects lab1 name/ID, existing VM collisions, unverified switch/IP allocation, attached source VHDs, source hash mismatch, reparse/overlapping/root paths, insufficient capacity and mismatched target disks. No host switch creation, firewall/routing changes, arbitrary script or shell runner exists. Provisioning leaves the new VM off; it does not configure Ubuntu automatically.

One persistent exclusive-lease directory serializes operations; a request file logs ID, operation, VM identity, start time, result and quarantine state. Duplicate IDs fail. Errors/crashes preserve quarantine. Even a successful command returns `awaiting-independent-verification`, never automatic recovery success. No automated deletion, lease release or retry cleanup is provided. Operator must inspect the exact request, current VM/disks/checkpoints and independent verification before archiving the lease directory in a later approved maintenance step. Keep request files to prevent replay. Reconciliation is manual and separate from the agent SQLite leases; no real agent run exists yet.

Residual limits: scripts are syntax/safety tested, not live Hyper-V qualified. Restore uses a compatibility report with disconnected NICs before importing a copy with GenerateNewId; it remains off pending distinct MAC/IP preparation. Validate that behavior on the disposable host at Gate B before enabling any lab. No live fault is authorized by Gate B provisioning approval.

Runtime: installed Node 25.1.0 remains unchanged. Node 24.22.2 was invoked separately via npm exec for qualification. Node's official [release schedule](https://github.com/nodejs/Release) lists supported LTS lines; [SQLite API](https://nodejs.org/docs/latest-v24.x/api/sqlite.html) supplies DatabaseSync. Use a supported patched Node 24 runtime for deployment after qualification; Node 26 is an alternative requiring its own test pass. Runtime support does not establish host recovery readiness.
