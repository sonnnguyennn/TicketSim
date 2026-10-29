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

Preferred installation: manual Hyper-V Manager/VMConnect from verified Ubuntu Server22.04.5 ISO, into a new20GiB dynamic VHDX; no prepared source VHDX required. Configuration A remains2vCPU/fixed2GiB/Gen2. Required >=4GiB free RAM includes2GiB host reserve; latest3.63GiB fails by0.37GiB. lab1 fixed2GiB/Dynamic Memory disabled is now VERIFIED; assigned/demand trends and sustainable spare host RAM remain UNKNOWN. Do not change lab1 to release resources. See VM_PROVISIONING_RUNBOOK.md for the approved-in-future procedure.

Configuration B is not selected: a 1 GiB guest would require >=3 GiB free by arithmetic, but no Ubuntu installation/Nginx workload or recovery measurements justify it. Keep it BLOCKED and leave tooling's 2 GiB requirement unchanged. Testing a smaller guest would itself need separate approval; lower RAM does not resolve storage/backup requirements.

Storage envelope remains VM20GiB+one checkpoint growth20GiB+restore copy20GiB+headroom10GiB=70GiB. Manual ISO path removes source-VHDX/build staging, but ISO (~2GiB actual bytes to verify), logs and other growth still need space: E70.35GiB is not approved. Clean cold export before checkpoint: reserve independent30GiB (disk20+headroom10); if staging ISO there too, >=32GiB available, adjusted to actual bytes. If exporting snapshot chains instead, budget their unique full files rather than assuming20GiB. Minimum external capacity means free usable space, not advertised device size; large-file-capable filesystem, device/volume identity, physical failure domain and integrity/availability must be approved. C20.14GiB fails. lab1's nested AVHDX and >=2 Standard checkpoints add retained-chain growth risk; measure all unique branch/parent files, never consolidate them. Unknown measurements and independent destination keep storage BLOCKED.

See [GATE_B_AUTHORIZATION_CHECKLIST.md](GATE_B_AUTHORIZATION_CHECKLIST.md) for the single operator proposal and [HOST_INVENTORY.md](HOST_INVENTORY.md) for current and historical evidence.
