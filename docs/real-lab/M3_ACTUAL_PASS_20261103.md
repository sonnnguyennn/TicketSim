# M3 actual browser trial — PASS, 2026-11-03

## Evidence and attribution

The operator supplied the output of the protected, read-only `Inspect-WebTrial.ps1`, checked at `2026-11-03T02:09:45.748Z` (09:09:45 Asia/Saigon), after three browser screenshots showing completed/pass/verified, all displayed grade checks passing, baseline PASS and one history entry. This record summarizes that operator-supplied report; Codex did not directly read the protected SQLite files or collect terminal keystrokes. The report reads the canonical Agent/operator databases and performs a fresh read-only host inspection.

- Approval: `lab-web-001-first-trial-20261103-001`; separately approved by the user before activation. The permit is consumed; it does not authorize another run.
- Run: `76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c`.
- Phase `completed`; grade `pass`; recovery `verified`; error code null.
- All 13 grade checks and all 21 baseline checks pass.
- Terminal revoked before grading: true.
- Reset attempts: exactly 1; reset outcome pass.
- Operator finalized: true; lease clear: true; work clear: true.
- Technical completion: true; livePass: true; old B5 lease absent.
- Agent principal `SONNGUYEN\TicketSimAgent`; Operator `SONNGUYEN\Admin`.

The immutable learner note is `nginx service stopped`. It records the symptom and is not a detailed repair/verification narrative. Functional PASS comes from actual state checks; this evidence does not establish the quality of the written explanation or reveal which repair commands the learner used.

## Fresh host result

Original `2b9c2170-9a23-4d08-b82e-29929afa4c10` is Running. Recovery `463dddf4-6e47-47b7-a39f-5b5d7ef84df0` and protected lab1 `546953dc-48e4-4080-839d-27ad5552ac7d` are Off. Exactly one checkpoint remains: `e6d04330-142c-4397-8e0d-ddf5a9e69090`, `ticketsim-lab-b5-clean-baseline-v1`.

Active disk `E:\TicketSimVMs\ticketsim-lab\ubuntu_EC4898F3-719D-4302-841A-F922B6CB3D16.avhdx` points to the original `ubuntu.vhdx`. The retained backup SHA256 is `3E410A9894FD5936A84B9625295081C5C2D3278D57C9D0BA8EBDD228661ED535`. Reported free bytes: RAM 2024591360, C 18065727488, E 37859762176. These are observations, not resource reservations.

Codex independently issued a fixed-target read-only Windows HTTP request at `2026-11-03T02:08:29.4001293Z`: status 200, exact `TicketSim LAB-WEB-001 baseline v1` plus LF. The screenshot's unsuccessful HTTP result at 09:02:25 was an earlier retained website observation, separate from the passing grade and later verified baseline. The frontend currently retains that observation until another website check; M4 should make its age and relation to recovery clear.

## Outcome and next boundary

M3 is **PASS on the actual original**, including browser learner workflow, independent grading, one checkpoint recovery, verification and lease release. No second trial, new checkpoint or mutation of protected/recovery VMs or backup is authorized by this result. Preserve the existing databases, approval, journals and completed history.

M4 now addresses packaging and normal browser operation. The current runtime still needs operator PowerShell for installation/startup; M3 is not evidence of an installer, automatic service startup, upgrade/uninstall or progress-origin migration. See `M4_PACKAGING_PLAN_20261103.md`.
