# Host inventory — Phase 1B-0

## Current Gate B readiness closure — 2026-10-29

VERIFIED (latest operator elevated evidence): lab1 `546953dc-48e4-4080-839d-27ad5552ac7d`, Running, is the only VM returned by Get-VM. eth0 MAC `525400563E97` → Default Switch (Internal, `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444`); eth1 MAC `5254009B8693` → Lab-Static (Internal, `4277a35c-217f-4096-a1a9-a691975f150f`). Host Lab-Static MAC `00155D380100`; host `10.77.77.1/24`, guest `10.77.77.2/24`; successful SSH previously confirmed. NIC-to-switch and host binding are resolved. No switch recreation is needed. This does not authorize modifying lab1.

Latest operator resources: total 15.77 GiB RAM, free 3.63 GiB; C free 20.14 GiB, E free 70.35 GiB. Free RAM fails 4 GiB policy; E is marginal for the 70 GiB envelope before source/build staging and other growth. VERIFIED (Codex read-only Get-Partition/Get-Disk): C is partition 3 on Disk 0, SK hynix BC501 256 GB; E is partition 2 on Disk 1, Kingston SNV2S500G 500 GB. They are distinct OS-visible physical disks, both reported through RAID bus type; independent external/offline backup remains unverified. C has insufficient 30 GiB backup headroom. No suitable other destination is approved.

UNKNOWN: lab1 assigned/startup/min/max/demand RAM, normal-workload RAM trends, actual VHD/AVHDX chain sizes and growth, image/backup files, final IP/MAC reservation. Get-VM showing only lab1 resolves the sampled new-VM name collision; repeat immediately before provisioning. It does not establish an unused IP. `E:\TicketSimImages` does not exist in the current Codex filesystem; no prepared source at the proposed path was verified.

Next operator action is read-only: capture `Get-VM -Name lab1 | Select-Object Name,Id,MemoryAssigned,MemoryDemand,MemoryStartup,MemoryMinimum,MemoryMaximum,DynamicMemoryEnabled`; capture every attached disk via `Get-VMHardDiskDrive -VMName lab1` and `Get-VHD -Path <actual path>` recursively for ParentPath; record Size/FileSize/ParentPath plus snapshots without altering them. Repeat host RAM samples during normal workload, document static/DHCP allocations, and identify an approved backup destination. See GATE_B_AUTHORIZATION_CHECKLIST.md for the complete current decision.

## Historical evidence below

Earlier UNKNOWN mapping statements below are superseded by the verified mapping above; access denials remain valid history for non-elevated Codex only.

## Current PM review update — Gate A closure, 2026-10-29

VERIFIED (new operator-supplied elevated output): `Default Switch`, ID `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444`, Internal; `Lab-Static`, ID `4277a35c-217f-4096-a1a9-a691975f150f`, Internal. Operator observes two lab1 VM adapters and the host Lab-Static virtual adapter. This resolves switch existence/type/ID for that context. Historical Codex access denial still describes its own permission context; it does not invalidate elevated results.

UNKNOWN: clean MAC-to-switch mapping for both lab1 adapters, exact host adapter binding, current VM allocations/names/disks and IP reservation. Do not infer mapping from adapter order. Match guest MAC `5254009B8693` to adapter, SwitchName and SwitchId, then identify eth0 separately. No new switch is proposed.

VERIFIED (Codex read-only repeat): free RAM 3,745,908 KiB (~3.57 GiB), below 4 GiB threshold. C free 21,612,126,208 bytes (~20.13 GiB), E free 75,532,447,744 (~70.35 GiB). Get-Volume shows C, E and a small unlettered recovery volume; no separate backup drive was observed. C cannot meet 30 GiB backup reserve. E headroom is marginal for 70 GiB base/checkpoint/drill policy and is not a complete resource approval. Hyper-V VM resource query remains access denied in Codex; assigned/demand/startup/min/max memory and dynamic-memory settings of existing VMs are UNKNOWN. Do not stop, shrink or alter them.

Operator should repeat the inventory below and add `Get-VM | Select-Object Name,Id,MemoryAssigned,MemoryDemand,MemoryStartup,MemoryMinimum,MemoryMaximum,DynamicMemoryEnabled`, plus dated RAM samples under representative workload. Query `Get-VMNetworkAdapter -VMName lab1 | Select-Object VMId,Name,MacAddress,SwitchName,SwitchId,IPAddresses`; correlate the exact MAC with host binding. Current proposal and separately approved actions are in [GATE_B_AUTHORIZATION_CHECKLIST.md](GATE_B_AUTHORIZATION_CHECKLIST.md). Later sections retain historical evidence.

## Phase 1B-1 Gate A repeat — 2026-10-29

VERIFIED (this session): 6 CPU cores/12 logical processors, 16,538,236 KiB visible RAM, 4,116,940 KiB free at sample; C free 21,790,810,112 bytes, E free 75,532,550,144 bytes. Host vEthernet addresses remain `10.77.77.1/24` (Lab-Static) and `172.22.112.1/20` (Default Switch). Capacity is a transient sample, not provisioning approval. The proposed 2 GiB VM plus 2 GiB host reserve fails the current free-RAM gate by a small margin.

VERIFIED (this context): Hyper-V switch, VM and lab1 adapter queries again returned permission errors. Their empty pipeline output is **not** an empty inventory or a PASS. VERIFIED (operator-supplied): an elevated session successfully queried lab1. These are different permission contexts. UNKNOWN: complete switch list/IDs/types, exact adapter mapping, VHD paths/current and maximum sizes, other VM names, allocated IPs and independent backup capacity. Lab-Static host alias alone does not resolve the switch discrepancy.

Operator read-only supplement (PowerShell with approved read permissions):

```powershell
$ErrorActionPreference = 'Stop'
Get-VMSwitch | Select-Object Name,Id,SwitchType
Get-VM | Select-Object Name,Id,State,Generation,Path
Get-VMNetworkAdapter -All | Select-Object VMName,VMId,Name,SwitchName,SwitchId,MacAddress,IPAddresses
Get-VM | Get-VMHardDiskDrive | ForEach-Object { Get-VHD -Path $_.Path } | Select-Object Path,Size,FileSize,ParentPath
Get-NetAdapter -Name 'vEthernet (Lab-Static)' | Format-List *
Get-NetIPAddress -AddressFamily IPv4
Get-NetRoute -AddressFamily IPv4
Get-NetNeighbor -AddressFamily IPv4
Get-Volume | Select-Object DriveLetter,SizeRemaining,Size
```

Match lab1 eth1 MAC `5254009B8693` to its VM adapter and switch ID, and correlate host adapter binding. Neighbor/ICMP absence does not prove an IP unused; reconcile static allocations, DHCP leases/reservations and all VM adapters before reserving a new address. No switch recreation/repair is authorized.

Evidence date: 2026-10-29. This is an inventory record, not authorization to operate a VM. `VERIFIED (operator-supplied)` means the PM supplied the result; `VERIFIED (this session)` means a read-only local query returned it. `INFERRED` and `UNKNOWN` do not satisfy readiness gates.

| Item | Evidence | Status |
|---|---|---|
| Host | `SONNGUYEN`, Windows 11 Pro build 26200; PowerShell 7.6.5 | VERIFIED (earlier preflight) |
| `lab1` identity | Hyper-V ID `546953dc-48e4-4080-839d-27ad5552ac7d`, Gen 2, Ubuntu 22.04, Running | VERIFIED (operator-supplied) |
| Multipass | 1.16.1, driver `hyperv` | VERIFIED (operator-supplied); lifecycle ownership UNKNOWN |
| Guest management | `eth1` UP, `10.77.77.2/24`, MAC `52:54:00:9b:86:93`; `/etc/netplan/60-lab-static.yaml`, renderer `networkd`, DHCPv4/v6 false, optional true | VERIFIED (operator-supplied); persistence after replacement/reboot UNKNOWN |
| Guest dynamic | `eth0` `172.22.122.192/20` on Default Switch side; prior address differed | VERIFIED (operator-supplied); never the stable endpoint |
| Host management side | `10.77.77.1/24` on `vEthernet (Lab-Static)`; connected `10.77.77.0/24` route; adapter UP, MAC `00-15-5D-38-01-00` | VERIFIED (this session) |
| Connectivity | Operator successfully used `ssh ubuntu@10.77.77.2`, source `10.77.77.1`; local TCP/22 probe returned true; VMConnect console accessible | SSH and console VERIFIED (operator-supplied); TCP VERIFIED (this session); host key fingerprint UNKNOWN |
| Switch and NIC mapping | Host adapter alias suggests a lab network | INFERRED only. Exact Hyper-V switch ID/type and guest-to-VM adapter mapping UNKNOWN |
| Hyper-V inventory | `Get-VM`, `Get-VMSwitch`, `Get-VMNetworkAdapter` access denied in this session | VERIFIED (this session); not evidence of guest failure |
| Recovery | Independent backup, restore drill, baseline fingerprint, disposable authorization | UNKNOWN / absent |

Historical Phase 0/1A observations remain in [VM_PREFLIGHT.md](VM_PREFLIGHT.md): Multipass returned IPv4 `N/A` and `info` timed out. Those control-plane observations do not negate the later, separately demonstrated static SSH endpoint. Earlier invalid `172.26.296.27` is not a usable address.

## Read-only host inventory still required

An operator with approved Hyper-V read access should record dated output for `Get-VM -Name lab1 | Select-Object Name,Id,State,Generation`, `Get-VMNetworkAdapter -VMName lab1 | Select-Object Name,SwitchName,MacAddress,IPAddresses`, `Get-VMSwitch | Select-Object Name,Id,SwitchType`, `Get-VMHardDiskDrive -VMName lab1`, and `Get-VMSnapshot -VMName lab1`. Match the guest `eth1` MAC to one VM adapter and its switch ID/type. Record `multipass list --format json` and `multipass info lab1 --format json` as separate controller evidence; resolve ownership explicitly. Inspect disk headroom and independent backup metadata; do not create or restore anything in this phase. `scripts/real-lab-preflight.ps1` collects the safe host inventory and optional TCP/22 probe, always with `ready:false`.
