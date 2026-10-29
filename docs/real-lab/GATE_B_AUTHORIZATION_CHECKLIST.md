# Gate B manual ISO proposal — NOT AUTHORIZED

PM reviewed bb0bc05: Gate A accepted; Gate B remains **NO-GO**. Preferred path is Hyper-V Manager → verified ISO → VMConnect installation → clean baseline → independent backup/drill. No prepared VHDX/build VM is required for this path. Existing scripts remain optional advanced tooling, unchanged.

| Decision item | Current status |
|---|---|
| VM | PROPOSED ticketsim-lab, direct Hyper-V, Ubuntu Server22.04.5, Gen2, 2vCPU, fixed2GiB RAM, Dynamic Memory disabled, new20GiB dynamically expanding VHDX. No copying lab1 disk/MAC/SSH/machine identity |
| RAM | BLOCKED: available3.63GiB<4GiB (guest2+host reserve2). Require repeated normal-workload headroom measurements; lab1 fixed2GiB/dynamic off is now VERIFIED. No existing VM changes to release RAM |
| VM/drill storage | BLOCKED: E70.35GiB is marginal for VM20+one checkpoint growth20+drill20+headroom10=70GiB, before ISO/logs/other growth. Proposed VM E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx, drill E:\TicketSimDrills\drill-001; exact paths not approved |
| Independent storage | BLOCKED: C20.14GiB<30GiB backup budget; no other approved destination. Require >=30GiB available for a clean <=20GiB cold export+10GiB reserve, on approved storage distinct from VM/drill volumes. If staging ~2GiB ISO there, require >=32GiB (actual ISO bytes added). Prefer adequately sized external/removable storage supporting large files, reliable availability/integrity and documented device identity; establish failure-domain independence. More export/checkpoint data requires more capacity |
| Existing topology | VERIFIED: Default Switch Internal `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444`; Lab-Static Internal `4277a35c-217f-4096-a1a9-a691975f150f`. lab1 eth0 MAC525400563E97→Default; eth1 MAC5254009B8693→Lab-Static. Host Lab-Static MAC00155D380100 at10.77.77.1/24; lab1 at10.77.77.2/24, prior SSH successful |
| New network | PROPOSED same two switches; candidate10.77.77.3/24 UNALLOCATED, reservation UNKNOWN. Need static/DHCP/VM allocation checks and distinct new MACs; failed ping proves nothing |
| ISO | VERIFIED published [Canonical Server22.04.5 ISO](https://releases.ubuntu.com/22.04.5/ubuntu-22.04.5-live-server-amd64.iso), [SHA256](https://releases.ubuntu.com/22.04.5/SHA256SUMS) `9bc6028870aef3f74f4e16b900008179e78b130e6b0b9a140635434a46aa98b0`. Local signature/hash/file verification UNKNOWN. Proposed E:\TicketSimImages\ubuntu-22.04.5-live-server-amd64.iso only if staging capacity approved; otherwise select approved external path and record it |
| lab1 disk chain | VERIFIED differencing AVHDX with another AVHDX parent and at least2 Standard checkpoints. Total retained chain size UNKNOWN; active FileSize alone is insufficient. No consolidation/deletion/resize authorized |

## Exact first operator action (READ-ONLY, now)

Return dated normal-workload free-RAM samples, existing lab1 assigned/demand/startup RAM, attached and checkpoint disk paths, full ParentPath chains with unique-path FileSize totals, and an actual backup/staging destination with device/volume ID and free capacity. Compare IP allocations and propose a reservation record. Do not modify VM resources, checkpoints or host networking. See HOST_INVENTORY.md.

## Separate approvals and future operations

| Approval | State-changing action, expected result | Failure response |
|---|---|---|
| Preparation | Approve download paths/tooling; obtain ISO+signed manifest and authenticate/local-hash check per runbook. No VM creation | Stop on missing/mismatched signature/hash; do not boot unverified media |
| B1 — create VM | **FIRST VM/HOST MUTATION:** Hyper-V Manager → New Virtual Machine, name ticketsim-lab, new Gen2 config/new20GiB dynamic VHDX at approved absent paths; verified ISO DVD; fixed2GiB/2vCPU; approved NICs/MACs; auto-start Nothing, leave off. Record actual ID | Quarantine partial config/disk, record ID/paths. No automatic rerun/deletion; exact cleanup requires separate approval |
| B2 — guest setup/validation | Approve first boot/VMConnect install, unique identities, reserved static management IP, OpenSSH/Nginx and deterministic page; host SSH fingerprint/auth and HTTP200/exact-content checks, console and explicitly approved reboot | Console diagnosis/new-guest rollback only under approval; unresolved network/boot/content checks quarantine. Never repair lab1/switch/NAT/firewall |
| B3 — baseline/independent backup | Approve clean shutdown, record baseline fingerprint, cold export **before fast checkpoint** to new independent destination, configuration/disk/hash inventory. Separately approve one reviewed baseline checkpoint for fast reset | Partial export/snapshot quarantined; preserve backup/original evidence. No success until files verified; no automatic deletion |
| B4 — restore drill | Approve copy import with new ID/new paths; off, auto-start Nothing, disconnect all NICs before first boot. Approve isolated console identity/MAC/IP changes then reconnect and timed boot/console/SSH/HTTP/baseline verification without guest SSH recovery dependency | Failed/incomplete drill quarantined; keep backup unchanged. No automatic lease release; exact reconciliation/cleanup separate |

Use [VM_PROVISIONING_RUNBOOK.md](VM_PROVISIONING_RUNBOOK.md) for exact UI selections/guest and host commands, [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md) for B3/B4. Every approval names target ID/path/request ID and scope. Prepared-VHDX `Invoke-Operator.ps1 -Operation provision` is optional only when a reviewed source VHDX actually exists; it is not the manual ISO entry point. No automatic ISO installer is added. No approval here permits execution, live Nginx faults or Start Real Lab.
