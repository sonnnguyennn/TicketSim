# Exact B5 checkpoint incident reconciliation

## Original classification and observed validation

Reviewed 4134092 and B5_CHECKPOINT_POSTCHECK_20261102.md. Original request b5-offline-baseline-20261102-001 has exactly two journal records: initial quarantined checkpoint, then failed-quarantined checkpoint with CHECKPOINT_POSTCHECK_FAILED. Original Result and CheckpointId fields are null. They are never filled in or rewritten by this recovery path.

The separate Reconcile-CheckpointIncident.ps1 entry point handles only this fixed request, original VM 2b9c2170-9a23-4d08-b82e-29929afa4c10 and checkpoint e6d04330-142c-4397-8e0d-ddf5a9e69090. Normal Resolve-FastReset.ps1 is unchanged and still rejects failed operations. No failed reset can enter this path.

Actual read-only validation on 2026-11-02 returned Validation=PASS and Applied=false. Original, recovery and lab1 were Off. The only checkpoint was ticketsim-lab-b5-clean-baseline-v1, Standard, created 2026-11-02T16:35:40.7384490Z; its attached 4 MiB AVHDX pointed to original ubuntu.vhdx. All four cold backup files passed pinned size/SHA256 checks. Independent evidence fields matched live inventory. Protected VM settings, attachments and checkpoint inventory fingerprint stayed identical across validation; this tool contains no VM mutation calls. Historic assurance that lab1 was untouched also comes from PM's incident decision; a complete pre-incident lab1 configuration fingerprint was not available to reconstruct retrospectively.

Pinned original journal SHA256: 79B389327DE4D005727B202897B8A446A2A2CAE4DB6997E6E7444C20CF9BC9F6. Pinned independent evidence SHA256: EAFEA35DBD2515A9AB67F4DBC7C7F4A2E7724EE83F0DCA3460D39BD0C39D37B3. The empty lease's exact original creation/write timestamp is 2026-11-02T16:35:14.6073575Z. Missing, changed or ambiguous inputs reject reconciliation.

## Reviewed operator command — approval required

Do not execute until the operator separately approves this exact reconciliation. Run from E:\Document\TicketSim:

```powershell
powershell.exe -NoProfile -NonInteractive -File E:\Document\TicketSim\scripts\real-lab\Reconcile-CheckpointIncident.ps1 -RequestId b5-offline-baseline-20261102-001 -VmId 2b9c2170-9a23-4d08-b82e-29929afa4c10 -CheckpointId e6d04330-142c-4397-8e0d-ddf5a9e69090 -Apply -Approval "APPROVE B5 checkpoint-incident-reconcile b5-offline-baseline-20261102-001 e6d04330-142c-4397-8e0d-ddf5a9e69090"
```

The command locks these fixed files while validating:

- Journal: E:\TicketSimOperatorState\b5\b5-offline-baseline-20261102-001.ndjson
- Lease: E:\TicketSimOperatorState\b5\exclusive-lease
- Evidence: E:\TicketSimOperatorState\b5\checkpoint-independent-verification-20261102.json

Only after all checks pass, it appends and flushes one checkpoint-incident-reconciled event containing approval, original failure classification, original journal hash and evidence hash. It never changes prior records or invents Result fields. It then atomically renames only the exact locked lease to E:\TicketSimOperatorState\b5\b5-offline-baseline-20261102-001.incident-reconciled-lease, retaining that artifact. The absence of exclusive-lease releases the operation quarantine; it does not mark B5 qualification PASS. No directory, checkpoint, backup or guest file is removed.

Validation/approval failure preserves journal and lease. If append succeeds but archive fails, lease remains and the changed journal rejects retries; stop for manual review. An interrupted or duplicate request must not automatically repeat Apply. There are no checkpoint/start/stop/reset/Nginx calls in this entry point.

## Tests and next boundary

npm test -- --run: 120/120 tests in 21 files, including 17 synthetic incident assertions: correct journal, wrong request/VM/checkpoint, missing incident marker, wrong action, extra checkpoint, wrong parent/type, backup mismatch, running recovery, missing/invalid evidence, wrong lease, missing approval, append-only successful reconciliation and duplicate rejection. Every validation failure checks lease retention and unchanged journal. All host collectors are replaced with synthetic observations in this harness; no real Hyper-V mutation is performed. npm run build passed. Existing learning sources/progress are unchanged.

Actual reconciliation Apply: NOT EXECUTED, awaiting distinct approval. After an approved Apply succeeds, read back journal and archived lease, verify original remains Off, then prepare the existing Invoke-FastReset read-only start plan with checkpoint e6d04330-142c-4397-8e0d-ddf5a9e69090 and a new request ID. Do not pass Apply to the start plan and do not boot automatically. PM review and separate marker/reset qualification approval remain required; no Nginx fault is authorized.
