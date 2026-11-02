# B5 actual qualification — PASS, 2026-11-03

## Outcome and identities

B5 is PASS based on actual operator Hyper-V operations, operator-authenticated marker verification, and independent host/SSH/HTTP/backup observations. This is not a mock-test result. Exact original: ticketsim-lab, 2b9c2170-9a23-4d08-b82e-29929afa4c10. Exactly one Standard offline baseline checkpoint: e6d04330-142c-4397-8e0d-ddf5a9e69090, ticketsim-lab-b5-clean-baseline-v1, created 2026-11-02T16:35:40.7384490Z. Final original Running; recovery 463dddf4-6e47-47b7-a39f-5b5d7ef84df0 Off; protected lab1 546953dc-48e4-4080-839d-27ad5552ac7d Off. No operation in this workflow targeted recovery or lab1.

The unique /var/tmp/ticketsim-b5-marker-20261103-7d6e92ac was created and read by the operator on original before stop/reset. Its content had a trailing literal n from Windows SSH quoting; the reset test intentionally checks pathname existence, not that formatting. After exact-checkpoint reset and approved boot, operator password-authenticated lab SSH returned ticketsim-lab and B5_MARKER_ABSENT after checking both existence and symlink. Codex did not claim the restricted service key could read that arbitrary pathname. This operator evidence and attribution are preserved in the final start independent record.

## Actual lifecycle and reconciliation

All request journals/evidence are retained under E:\TicketSimOperatorState\b5:

- b5-offline-baseline-20261102-001: original checkpoint created, postcheck incident independently reconciled with append-only event; original failure/Result=null retained.
- b5-marker-start-20261102-001: approved start, verified and reconciled.
- b5-marker-stop-20261103-001: clean original shutdown, verified and reconciled.
- b5-marker-reset-20261103-001: exact checkpoint applied once, original remained Off. New active child ubuntu_83AD4936-2462-4F77-9477-A02DDAA14573.avhdx points to original ubuntu.vhdx. Host action reconciled separately; guest verification remained pending until approved boot.
- b5-postreset-start-20261103-001: approved boot, independent guest baseline and marker evidence verified. Final reconciled event timestamp 2026-11-02T17:51:52.6727269Z; read-back confirmed all three journal records and absence of exclusive-lease.

No reset retry, extra checkpoint creation, snapshot deletion or manual journal-status rewrite occurred. There is no outstanding B5 operator lease. No default agent runs.sqlite exists and no live run was started; no alternate TICKETSIM state configuration was observed in this process. This does not prove absence of arbitrary databases owned by other users.

## Baseline and backup verification

Dedicated forced-command service key authenticated after reset and preserved original host fingerprint SHA256:8LJ5bycBjgnfgRXp5tFh1jV/BGrfvb41rQQnzfbVi3U. Management eth1 retained 10.77.77.3/24 and host route via eth1. Nginx active; nginx -t and sshd -t succeeded. Independent Windows HTTP returned 200 and exactly TicketSim LAB-WEB-001 baseline v1 plus LF. Page SHA256 1f9236c846970eaf058b495c502de066488374dc530d54f17c5924603fe7a786. Nginx, SSH, Netplan and cloud-init config hashes and normalized nft ruleset hash matched the pre-checkpoint guest-agent baseline. Unsupported service-key operation returned DENIED/126 during preparation; no stop-nginx operation was invoked.

All four retained cold-export sizes/SHA256 passed repeatedly before/after reset and in the real read-only pretrial host inspect. Backup VHDX remains 3E410A9894FD5936A84B9625295081C5C2D3278D57C9D0BA8EBDD228661ED535. The cold backup predates guest-agent provisioning; after cold restoration, reinstall the reviewed forced-command account/key/sudoers and verify again. The fast checkpoint includes that account and it survived reset.

Final recorded resources: RAM free 4,465,700,864 bytes (~4.16 GiB), C free 18,782,294,016 bytes (~17.49 GiB), E free 37,838,450,688 bytes (~35.24 GiB). These observations are not reservations; recheck before each live operation.

## First LAB-WEB-001 boundary

Actual LiveOperations.observe(preflight) passed every required check using the real SSH key, independent HTTP, and fixed read-only Invoke-LabHost inspect. assertNonAdmin passed for this Codex process. The actual operator runHostAction(real-host-inspect-v1) subprocess also passed with the exact original/checkpoint and backup. There was no HTTP operator daemon activation, run claim, fault, learner grade or post-lab automatic recovery trial. Those remain unqualified live integration until the separately approved first run; unit tests do not substitute for it. Current account has operator-granted Hyper-V Administrators membership; non-administrator process status does not imply OS-enforced restriction to only one VM.

Machine-readable actual result: E:\TicketSimOperatorState\b5\B5-QUALIFICATION-PASS-20261103.json. Real preflight observations: pretrial-readonly-20261103.json. Postreset probes: postreset-baseline-probes-20261103.json. A separate first-trial-approval.DRAFT.json contains actual B5 proof/checkpoint/hashes with firstTrialApproved=false and resetApproved=false; it is not loaded by the agent. No secret key/token is committed.

Stop here for PM's fresh first-trial decision. Proposed fault is only real-web-stop-nginx-v1 on original, with external learner SSH lab@10.77.77.3. The exact-checkpoint recovery process also requires approval before that run is enabled. Do not enable live services or inject the fault based solely on B5 PASS. Prior regression result remains 121/121 unit tests and build PASS; this final report changes documentation only.
