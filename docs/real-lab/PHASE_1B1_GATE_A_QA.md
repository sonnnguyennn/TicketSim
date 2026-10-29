# Phase 1B-1 Gate A — 2026-10-29

## PM review closure addendum

Latest readiness closure: PM accepted Gate A at 2414d19. lab1 NIC mapping and host binding are now VERIFIED; use the current GATE_B_AUTHORIZATION_CHECKLIST and NETWORK_DESIGN. Resource/image/IP/backup approval still blocks Gate B. Reports below preserve earlier evidence and test counts.

The sections below retain the original 15158b8 QA, including 49/51 browser first-run and 2/2 targeted results. Current evidence, safety fixes and final validation are recorded in [PHASE_1B1_GATE_A_REVIEW_FIXES.md](PHASE_1B1_GATE_A_REVIEW_FIXES.md); use that addendum plus [GATE_B_AUTHORIZATION_CHECKLIST.md](GATE_B_AUTHORIZATION_CHECKLIST.md) for the current decision. Operator elevation now confirms both Internal switch IDs; exact NIC mapping is still pending. Gate B remains NO-GO.

Scope: read-only validation, operator tooling and mocked tests. Gate B is not authorized. Reviewed commit 03910ee, agent server/auth/registry/profile/store/service and Real Lab documentation. Existing server-owned mock identity, protected lab1, no command API, unknown recovery quarantine and unavailable real Start control remain intact. No change to Guided, Objective Exam, original tickets, answers or v5 progress. Four pre-existing untracked user audit files are preserved.

## Host result and recommendation

Confirmed in this context: CPU 6 cores/12 threads; visible RAM 16,538,236 KiB, free 4,116,940 KiB at sample; C free 21,790,810,112 bytes and E free 75,532,550,144 bytes; host management IP 10.77.77.1/24 and Default Switch-side 172.22.112.1/20. Hyper-V VM/switch/adapter reads returned permission errors again. Operator-supplied elevated Get-VM success is recorded independently. Empty output following an error is not a healthy inventory.

UNKNOWN: actual switch IDs/types and host binding, all VM names/disks, maximum/current VHD requirements, static allocation conflicts, independent backup volume. Lab-Static alias versus absent readable switch inventory remains unresolved; do not recreate the switch. Exact operator read commands are in HOST_INVENTORY.md.

Propose 2 vCPU, 2 GiB RAM, 20 GiB maximum standalone VHDX, existing verified internal management switch plus NAT/default NIC. Candidate 10.77.77.3/24 and example MACs are unreserved proposals. Current RAM sample fails 2 GiB guest + 2 GiB host headroom. Backup requires a distinct volume with at least 30 GiB available; example F is not verified hardware. If VM and drill share E, reserve at least 70 GiB there. Actual sizing also needs source image and host workload review.

**NO-GO for creating ticketsim-lab now.** Gate A tooling can be reviewed; Gate B needs the missing host evidence and explicit Product Owner approval. No VM, backup, checkpoint, restart, recovery drill or guest script was executed in Gate A. Apply-path qualification on Hyper-V remains unexecuted.

## Prepared implementation

- `scripts/real-lab/Invoke-Operator.ps1` and `HyperV.Operator.psm1`: plan by default; future apply requires exact operation/request approval text. Fixed provision/checkpoint/reset/backup/restore-copy operations, source SHA256/VHD checks, path checks, switch/MAC/IP/capacity checks, protected lab1, collision protection, actual VM ID binding, disk binding, exclusive persistent quarantine and request journals. No VM start, cleanup or host network mutation commands.
- `operator.example.json`: intentionally incomplete/unapproved. Separate source/image, VM, backup, drill and state destinations. New immutable ID is learned only from actual future provisioning. Source must be a prepared unattached Ubuntu 22.04 Gen2 image; OS/network installation remains explicit operator work.
- Cold independent export with hashes and baseline fingerprint; restore-copy uses distinct generated identity and disconnected NICs before import. Operator verifies console, distinct addressing, SSH identity/authentication, HTTP bytes and package versions before recovery evidence passes. No automatic lease release. Checkpoint reset remains a separate fast path, not DR proof.
- `verify-baseline.sh`: prepared Ubuntu read-only probe; has not run on any guest. Nginx version remains unknown until baseline exists. Real fault/grading remains design only.
- `operator.safety.ps1` and Vitest wrapper: synthetic files/inventory, mocked reset cmdlet, no Hyper-V provider imported. Safety tests run under normal `npm test` through updated Vite include.

## Verification record

`npm test -- --run`: 94/94 tests, 15 files. `prepare-data` and content audit run as hooks: 112 original/Guided cases, 122 command cards, 0 audit errors. Build passed with existing bundle-size advisory. PowerShell syntax parsing passed and isolated harness passed 16 assertions, including dry-run, protected name/ID, existing VM, IP/MAC collision, missing switch, insufficient RAM/storage, missing/invalid backup, failed recovery evidence, duplicate request, restart quarantine and a mocked reset retaining quarantine. No live apply operation was run.

Installed Node 25.1.0 was not replaced. Portable/npm-exec Node 24.22.2 passed all 94 tests with `--maxWorkers=2`, including SQLite migration/restart and API checks. An earlier unrestricted concurrent Node 24 run had two existing content tests exceed 5-second limits (92/94); bounded rerun passed. Node 26 was reviewed as an alternative but not executed. This is test qualification, not approval for deployment privileges.

Browser initial run: 49/51; v2 migration and VPS-06-001 hint assertion failed during concurrent test/build work. Targeted isolated rerun: 2/2 passed with one worker. All 51 cases passed across the initial run and targeted rerun; a clean 51/51 single invocation is not claimed. No learning code was changed to mask these failures.

## Gate B review package and exact actions

1. Operator with approved read permissions supplies complete switch/NIC/host binding and disk/VM/IP allocation inventory; resolve Lab-Static discrepancy. Confirm spare RAM and an independent backup volume.
2. Review prepared Ubuntu 22.04 image provenance/hash/max VHD size, Gen2 boot, Nginx/SSH package versions and deterministic page fingerprint. Fill configuration with actual paths/switches, reserve a unique IP/MAC pair and explicitly authorize only the new VM as disposable.
3. Product Owner explicitly approves Gate B scope: create/configure the new VM, independent backup and isolated restore drill; lab1 excluded, live fault injection excluded. Review PRIVILEGE_BOUNDARY.md and plan output first.
4. Operator runs plan command from VM_PROVISIONING_PLAN.md. Only after approval, use the matching `-Apply` and exact operation/request approval phrase. Record actual VM ID, leave VM off for review, then separately perform approved console/guest setup and host probes. Reconcile/ archive persistent lease only after exact state and evidence review; preserve journals.
5. Establish clean baseline/checkpoint and independent cold export; run isolated restore-copy with new identity, distinct IP/MAC before networking, then boot/console/SSH/HTTP/content verification and timed recovery without guest SSH. Failed/incomplete results stay quarantined. Report actual results before any first live Nginx lab review.

Changed files: operator module/entry/config/safety harness/baseline probe, Vitest wrapper/include, HOST_INVENTORY, NETWORK_DESIGN, VM_PROVISIONING_PLAN, BACKUP_RECOVERY, PRIVILEGE_BOUNDARY, LAB_WEB_001_SPEC, this QA and ROADMAP. No Gate B actions were performed.
