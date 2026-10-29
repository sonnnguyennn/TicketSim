# Host inventory — Phase 1B-0

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
