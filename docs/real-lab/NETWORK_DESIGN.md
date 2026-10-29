# Current Real Lab network and capacity design

Gate A ACCEPTED (`2414d19`); Gate B NOT AUTHORIZED. This current design supersedes historical mapping uncertainty preserved in HOST_INVENTORY and earlier QA.

## VERIFIED topology (operator elevated output)

| Endpoint | MAC | Hyper-V switch | Switch ID |
|---|---|---|---|
| lab1 eth0, dynamic/default-side | `525400563E97` | Default Switch, Internal | `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444` |
| lab1 eth1, `10.77.77.2/24` | `5254009B8693` | Lab-Static, Internal | `4277a35c-217f-4096-a1a9-a691975f150f` |
| Windows management `10.77.77.1/24` | `00155D380100` | Host Lab-Static adapter | Same existing Lab-Static network |

Windows SSH to lab1 was previously confirmed. lab1 ID is `546953dc-48e4-4080-839d-27ad5552ac7d`; it is protected and unchanged. Earlier Get-* denials were observations from non-elevated Codex, not a failure of operator elevation. Historical dynamic eth0 `172.22.122.192/20` may change and is not a stable management address. Static eth1 is MAC-bound through Netplan; reboot/NIC replacement persistence and SSH host-key fingerprint remain unverified.

PROPOSED ticketsim-lab would reuse these verified switches: management on Lab-Static, controlled package access on Default Switch. Candidate `10.77.77.3/24` and locally administered MACs are not reserved. Check all static allocations, DHCP scopes/reservations and VM NIC/IP inventory, then record reservation; failed ping/empty neighbor cache cannot prove availability. Observe actual guest interface names and pin SSH host identity after approved creation. Keep no default route on management NIC. Preserve independent console recovery and never fault SSH, routing or firewall for LAB-WEB-001.

## Capacity decision

Only configuration A is retained: 2 vCPU, fixed 2 GiB RAM, Gen2 Ubuntu Server 22.04, standalone VHDX max 20 GiB. Required >=4 GiB free RAM includes 2 GiB host reserve. Latest free 3.63 GiB fails by 0.37 GiB; no existing VM may be altered to make room. Startup=2 GiB, Dynamic Memory disabled; min/max ballooning settings are inactive. Need lab1 assigned/startup/demand inventory and representative host workload samples to establish sustainable headroom.

Configuration B is not selected: a 1 GiB guest would require >=3 GiB free by arithmetic, but no Ubuntu installation/Nginx workload or recovery measurements justify it. Keep it BLOCKED and leave tooling's 2 GiB requirement unchanged. Testing a smaller guest would itself need separate approval; lower RAM does not resolve storage/backup requirements.

Storage envelope: VM base 20 GiB + one checkpoint/AVHDX 20 GiB + restore copy 20 GiB + shared-volume headroom 10 GiB =70 GiB, plus independent backup 20+10 GiB=30 GiB. E free70.35 GiB is marginal and does not budget a source VHDX and installer/build staging if retained there; actual image FileSize, logical Size, chain sizes and staging location must be added before GO. More snapshots require a new budget. C/E are distinct disks as confirmed by read-only partition/disk queries, but C free20.14 GiB fails backup budget; no other destination is approved. Volume UniqueId checks in tooling establish logical separation, not complete physical/offline disaster protection. Unknown resource measurements and backup destination block execution.

See [GATE_B_AUTHORIZATION_CHECKLIST.md](GATE_B_AUTHORIZATION_CHECKLIST.md) for the single operator proposal and [HOST_INVENTORY.md](HOST_INVENTORY.md) for current and historical evidence.
