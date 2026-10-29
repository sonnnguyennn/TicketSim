# Gate B authorization proposal — NOT APPROVED

Decision: **NO-GO** until all missing fields below are evidenced and each operation is individually approved. This document is a review package, not approval or an executable completed configuration. No apply mode ran during Gate A closure.

## Target and evidence checklist

| Item | Proposed/observed value | Required before approval |
|---|---|---|
| Target | New `ticketsim-lab`, direct Hyper-V, Gen2, Ubuntu 22.04; actual ID null until creation | Complete VM/name/disk collision inventory; disposable authorization |
| CPU/memory | 2 vCPU, fixed 2 GiB; Dynamic Memory disabled | Representative workload RAM samples >=4 GiB free, existing VM assigned/demand/min/max inventory; current 3.57 GiB sample fails |
| Disk | Standalone VHDX maximum 20 GiB | Actual image size, current and maximum attached/parent-chain VHD/AVHDX inventory; growth budget |
| Management switch | Operator-verified Lab-Static, Internal, `4277a35c-217f-4096-a1a9-a691975f150f` | Clean lab1 eth1 MAC-to-adapter/SwitchName/SwitchId plus host adapter binding and isolation policy |
| Package-access switch | Operator-verified Default Switch, Internal, `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444` | Clean eth0 mapping; confirm existing topology; no switch/NAT alteration |
| Management address | Candidate `10.77.77.3/24` only | Select/reserve actual unused IP; compare static allocation records, DHCP scope/reservations, all VM NICs and neighbor evidence; no ping response is insufficient |
| MACs | Example `020077770003` / `020077770103` only | Select distinct unused MACs; observe actual guest interface names after approved provisioning |
| Image and SHA256 | **UNKNOWN**; prepared Ubuntu 22.04 bootable Gen2 standalone VHDX | Supply source/version/provenance, expected SHA256 from trusted source/build record, verified local hash, actual OS/Nginx/SSH versions |
| Source path | Example `E:\TicketSimImages\ubuntu-22.04-prepared.vhdx` | Operator selects exact existing unattached verified image file |
| VM path | Proposed `E:\TicketSimVMs\ticketsim-lab` | Operator approves exact absent destination and parent ACL/capacity |
| Backup path | **UNKNOWN**; F example is not an observed drive | Select independent volume/destination, at least 30 GiB reserve; C ~20.13 GiB is insufficient; preserve backup integrity manifest offline/read-only |
| Restore path | Proposed `E:\TicketSimDrills\drill-001` | Approve exact absent destination, separate restored VM identity/MAC/IP and isolated NICs |
| Journal path | Proposed `E:\TicketSimOperatorState` | Operator-controlled ACLs, local volume, outside VM/backup/drill roots |
| Resource envelope | Shared VM+one checkpoint+copy: 60 GiB max growth +10 GiB headroom; separate backup:20+10 GiB | Volume IDs/capacity, existing workloads and chain growth; E ~70.35 GiB is marginal; independent backup volume still missing |

All proposed paths remain unapproved. Example config has real switch IDs but keeps disposable, switch-mapping and IP-allocation flags false. Do not set them true until their distinct evidence exists. More checkpoints, larger image or memory policy changes require a revised budget. Backup volume independence does not alone prove separate physical failure domain; record that too.

## Read-only preparation

Use the exact queries in HOST_INVENTORY.md under an operator context with approved read permissions; do not elevate the local agent. Archive clean dated output and repeat free-memory/storage sampling under normal workload. Pin deployment to the separately qualified Node 24.22.2 or requalify a later supported patched LTS; installed Node 25.1.0 is unchanged.

After reviewing and saving the fully populated config at an operator-selected absolute path (example `E:\Reviewed\ticketsim.json`), default planning is read-only:

```powershell
pwsh -NoProfile -File scripts/real-lab/Invoke-Operator.ps1 -ConfigPath E:\Reviewed\ticketsim.json -Operation provision -RequestId provision-0002
```

Each subsequent operation also requires its own fresh plan output and approval tied to actual VM ID, reviewed config/hash, request ID, expected result and failure response. Approval text is an operator attestation, not authentication of the Product Owner.

## Individually approved host changes — proposals only

The following commands **WOULD CHANGE THE HOST** if executed with apply authorization; none was executed. Paths and prerequisites are not yet complete. A provisioning approval does not approve later operations or live Nginx faults.

| Operation | Future command suffix to the entry point above | Expected result | Failure/rollback response |
|---|---|---|---|
| Create VM | `-Operation provision -RequestId provision-0002 -Apply -Approval 'APPROVE GATE B provision provision-0002'` | Copy verified VHD without overwrite; new Gen2 VM off, 2 vCPU/fixed2GiB, intended NICs; journal actual ID | Retain quarantine/files; reconcile actual ID and partial resources. No automatic deletion or reuse. Cleanup requires exact separate approval |
| Console/guest setup and first boot | Separate operator procedure approval, not provided by this entry point | Configure only new VM's MAC-bound static NIC, SSH keys and pinned Nginx/page; verify console, host SSH/HTTP | Stop progression; preserve management/console evidence; repair only new disposable target under approval. No lab1/switch/global network changes |
| Fast baseline checkpoint | `-Operation checkpoint -RequestId baseline-0002 -Apply -Approval 'APPROVE GATE B checkpoint baseline-0002'` | Powered-off target gets reviewed baseline; record checkpoint ID | Quarantine, inspect snapshot inventory. Never delete/checkpoint unrelated VM |
| Independent cold backup | `-Operation backup -RequestId backup-0002 -Apply -Approval 'APPROVE GATE B backup backup-0002'` | Export to new independent destination; all hashes, actual VM ID and exact baseline fingerprint recorded | Preserve original VM and backup; incomplete new export quarantined. New destination/retry requires review; never overwrite existing backup |
| Isolated restore copy | `-Operation restore-copy -RequestId drill-0002 -Apply -Approval 'APPROVE GATE B restore-copy drill-0002'` | Import copy with generated distinct ID, NICs disconnected before import, off; journal copy identity | Retain quarantine; inspect import/compatibility state before any rename/start/connect; do not destroy source backup |
| Optional fast reset demonstration | `-Operation reset -RequestId reset-0002 -Apply -Approval 'APPROVE GATE B reset reset-0002'` | Restore exact approved checkpoint on powered-off original disposable target | Quarantine if unknown/failure; checkpoint success does not replace independent drill |

Use the full entry point and `-ConfigPath` for each row; replace the earlier `-Operation`/`-RequestId`, do not append duplicate arguments. The actual immutable VM ID obtained after provision must be written into the reviewed config before later operations. Target must be off for checkpoint/reset/export/import planning. Keep request journals; do not remove quarantine merely to continue the table. Reconcile exact current state and independently verify each result before separately approving lease archival and the next operation.

## Restore-copy drill acceptance

Before boot/reconnect of the copy, independently verify generated ID, automatic start disabled, distinct MACs and reserved distinct IP (use console/isolation to replace the copied static address). Keep original off. Host import/export must work without guest SSH. Under separate boot/network approval, verify console/boot, SSH pinned identity then authentication, host HTTP 200/exact page bytes and baseline fingerprint, Ubuntu and Nginx versions. Record elapsed seconds and all evidence. Unknown/failed checks retain quarantine. No Start Real Lab or live fault injection approval follows automatically from this checklist.
