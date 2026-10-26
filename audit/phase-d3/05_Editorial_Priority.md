# D3-A — Editorial priority

## P0: technical and answer validity

Review all 620 keys against the evidence in the topic JSON packets. The automated structural check found 0 missing-link or missing-probe issues; this is **not** a semantic correctness verdict. Start with L3/L2 and any question whose option could also be defensible. Preserve IDs and keys until a separate approved content change.

## P1: concrete editorial flags

The triage rules flagged 0 clarity, 9 distractor, and 48 feedback candidates. The CSV records a text excerpt and authored location for each.

| First review | Topic | Level | Labels | Source |
|---|---|---|---|---|
| VPS-12-008/evidence | Control Panel | L3 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2619 |
| VPS-07-007/check | Web Server & HTTP | L3 | EDIT_DISTRACTORS | scripts/content/phase-b-06-10.mjs:466 |
| VPS-04-008/check | CPU, RAM & Performance | L3 | EDIT_DISTRACTORS | scripts/content/phase-b-01-05.mjs:519 |
| VPS-10-007/evidence | Virtualization | L3 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:987 |
| VPS-10-008/output | Virtualization | L3 | EDIT_DISTRACTORS | scripts/content/phase-b-06-10.mjs:1009 |
| VPS-09-007/check | Security & Abuse | L3 | EDIT_DISTRACTORS | scripts/content/phase-b-06-10.mjs:158 |
| VPS-13-007/evidence | Docker & Containers | L3 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:1259 |
| VPS-13-008/evidence | Docker & Containers | L3 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:1429 |
| VPS-11-008/evidence | Backup & Recovery | L3 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:4257 |
| VPS-12-007/evidence | Control Panel | L3 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2463 |
| VPS-12-008/check | Control Panel | L3 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2583 |
| VPS-14-007/evidence | Billing & Lifecycle | L3 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:402 |
| VPS-11-005/evidence | Backup & Recovery | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:3770 |
| VPS-11-006/evidence | Backup & Recovery | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:3934 |
| VPS-12-005/evidence | Control Panel | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2142 |
| VPS-14-005/evidence | Billing & Lifecycle | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:90 |
| VPS-07-006/check | Web Server & HTTP | L2 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:776 |
| VPS-07-006/evidence | Web Server & HTTP | L2 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:778 |
| VPS-07-005/check | Web Server & HTTP | L2 | EDIT_DISTRACTORS | scripts/content/phase-b-06-10.mjs:72 |
| VPS-08-006/evidence | DNS & Domain | L2 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:368 |
| VPS-06-006/output | VPS Management | L2 | EDIT_DISTRACTORS | scripts/content/phase-b-06-10.mjs:919 |
| VPS-10-006/order | Virtualization | L2 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:966 |
| VPS-13-005/triage | Docker & Containers | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:1037 |
| VPS-13-005/check | Docker & Containers | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:1055 |
| VPS-11-005/triage | Backup & Recovery | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:3716 |
| VPS-12-005/check | Control Panel | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2106 |
| VPS-12-006/triage | Control Panel | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2245 |
| VPS-12-006/evidence | Control Panel | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2299 |
| VPS-14-006/check | Billing & Lifecycle | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:210 |
| VPS-14-006/evidence | Billing & Lifecycle | L2 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:246 |
| VPS-13-004/evidence | Docker & Containers | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2002 |
| VPS-12-003/check | Control Panel | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:3003 |
| VPS-14-003/triage | Billing & Lifecycle | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:765 |
| VPS-05-004/output | Disk & Filesystem | L1 | EDIT_DISTRACTORS | scripts/content/phase-b-01-05.mjs:322 |
| VPS-03-004/check | Linux System & Services | L1 | EDIT_FEEDBACK | scripts/content/phase-b-01-05.mjs:579 |
| VPS-07-003/check | Web Server & HTTP | L1 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:746 |
| VPS-07-003/evidence | Web Server & HTTP | L1 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:748 |
| VPS-10-003/evidence | Virtualization | L1 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:285 |
| VPS-09-003/check | Security & Abuse | L1 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:350 |
| VPS-11-003/check | Backup & Recovery | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:4505 |
| VPS-11-004/triage | Backup & Recovery | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:4622 |
| VPS-11-004/evidence | Backup & Recovery | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:4676 |
| VPS-12-003/evidence | Control Panel | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:3039 |
| VPS-14-003/evidence | Billing & Lifecycle | L1 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:819 |
| VPS-03-001/triage | Linux System & Services | L0 | EDIT_DISTRACTORS | scripts/content/phase-b-01-05.mjs:542 |
| VPS-05-002/output | Disk & Filesystem | L0 | EDIT_FEEDBACK | scripts/content/phase-b-01-05.mjs:285 |
| VPS-05-002/evidence | Disk & Filesystem | L0 | EDIT_FEEDBACK | scripts/content/phase-b-01-05.mjs:286 |
| VPS-07-001/evidence | Web Server & HTTP | L0 | EDIT_DISTRACTORS | scripts/content/phase-b-06-10.mjs:808 |
| VPS-08-001/evidence | DNS & Domain | L0 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:395 |
| VPS-10-001/evidence | Virtualization | L0 | EDIT_FEEDBACK | scripts/content/phase-b-06-10.mjs:247 |
| VPS-13-001/triage | Docker & Containers | L0 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:1530 |
| VPS-13-001/evidence | Docker & Containers | L0 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:1584 |
| VPS-12-001/triage | Control Panel | L0 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2716 |
| VPS-12-002/triage | Control Panel | L0 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2849 |
| VPS-12-002/output | Control Panel | L0 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2885 |
| VPS-12-002/evidence | Control Panel | L0 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:2903 |
| VPS-14-002/triage | Billing & Lifecycle | L0 | EDIT_FEEDBACK | scripts/content/phase-b-11-14.mjs:632 |

## P2: human review queue

The 563 KEEP rows still need a human pass for multiple defensible options, command behavior, hint leakage, level calibration, and evidence sufficiency. Compare each question with its full case packet and Command Library card. Mark SME approval only after that pass.

## Command Editorial

Check 46 linked IDs whose verification is not SOURCE_VERIFIED, followed by source-verified cards whose examples have no lab check. Details are in `04_Command_Content_Conflicts.md` and the D2 command ledger.
