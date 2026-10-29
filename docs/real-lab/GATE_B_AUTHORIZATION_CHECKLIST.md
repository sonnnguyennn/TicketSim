# Gate B proposal — NOT AUTHORIZED / NO-GO

PM accepted Gate A at `2414d19`. This is the current single approval package; previous QA remains historical. No VM mutation or real apply was performed.

| Item | Status and exact proposal |
|---|---|
| VM | PROPOSED configuration A: ticketsim-lab, direct Hyper-V, Gen2, Ubuntu Server22.04, 2 vCPU, fixed2GiB, Dynamic Memory off, standalone max20GiB VHDX. New VM ID UNKNOWN until creation; lab1 protected. Lighter configuration B BLOCKED by absent workload evidence; do not lower policy |
| Switches | VERIFIED: eth0 `525400563E97`→Default Switch Internal `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444`; eth1 `5254009B8693`→Lab-Static Internal `4277a35c-217f-4096-a1a9-a691975f150f`; host Lab-Static MAC `00155D380100`. Reuse for new target is PROPOSED, subject to isolation/security approval |
| Management | PROPOSED `10.77.77.3/24`, unallocated/unreserved. Existing host .1 and lab1 .2 VERIFIED. Compare static/DHCP records, VM NICs and neighbor evidence, then reserve IP and distinct MACs; failed ping is insufficient |
| Official installer | VERIFIED published provenance: [Canonical Ubuntu22.04.5 Server ISO](https://releases.ubuntu.com/22.04.5/ubuntu-22.04.5-live-server-amd64.iso). Published SHA256 `9bc6028870aef3f74f4e16b900008179e78b130e6b0b9a140635434a46aa98b0` from [SHA256SUMS](https://releases.ubuntu.com/22.04.5/SHA256SUMS); manifest signature/local-file verification still pending |
| Local source | PROPOSED ISO `E:\TicketSimImages\ubuntu-22.04.5-live-server-amd64.iso`; prepared VHDX `E:\TicketSimImages\ubuntu-22.04-prepared.vhdx`. Actual local files/hash UNKNOWN; directory currently absent. ISO hash is not the VHDX hash. Existing tool requires prepared VHDX and cannot install from ISO |
| Paths | PROPOSED VM `E:\TicketSimVMs\ticketsim-lab`, drill `E:\TicketSimDrills\drill-001`, state `E:\TicketSimOperatorState`. No paths are operator-approved. Independent backup path UNKNOWN; example F drive is a placeholder, not observed hardware |
| RAM/storage | BLOCKED: free3.63GiB<4GiB; E70.35GiB marginal for70GiB envelope before staging/other growth; C20.14GiB<30GiB backup. VERIFIED C=Disk0 SK hynix256GB, E=Disk1 Kingston500GB. Need actual VHD/AVHDX sizes, host workload RAM trends and approved independent destination |

## Exact next operator action — read-only

Supply dated `Get-VM -Name lab1 | Select-Object Name,Id,MemoryAssigned,MemoryDemand,MemoryStartup,MemoryMinimum,MemoryMaximum,DynamicMemoryEnabled`, `Get-VMHardDiskDrive -VMName lab1`, `Get-VMSnapshot -VMName lab1`, and `Get-VHD -Path <each actual disk path>` recursively for ParentPath; record Size/FileSize/ParentPath. Sample host free RAM during normal workloads, identify backup media and available capacity, and supply IP reservation record. Do not stop/shrink existing VMs. Get-VM currently returns only lab1 (operator VERIFIED); repeat name/IP/MAC/path collision checks just before any approved operation.

## Image preparation and initialization — separately approved, not run

Choose the official ISO above; save ISO, SHA256SUMS and SHA256SUMS.gpg, authenticate the manifest with Canonical's Ubuntu signing-key procedure, then compare `Get-FileHash -Algorithm SHA256 -LiteralPath E:\TicketSimImages\ubuntu-22.04.5-live-server-amd64.iso` with its published entry. [Ubuntu verification guide](https://ubuntu.com/tutorials/how-to-verify-ubuntu). No ISO was downloaded or hash/signature verified locally in this closure.

On a separately approved build environment, install from the verified ISO into a fresh <=20GiB standalone VHDX on a Gen2 UEFI VM with the Microsoft UEFI Certificate Authority secure-boot template. Microsoft lists [Ubuntu Hyper-V support](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/supported-ubuntu-virtual-machines-on-hyper-v). Actual boot/installation remains untested. Use console installation (not an assumed cloud-init login), install OpenSSH and pinned Nginx, deterministic page, record exact OS/package versions; avoid copying lab1 identity/keys. Shut down, detach, hash prepared VHDX and record build provenance. Stage the verified file at the proposed source path only after storage approval. Tool verifies that VHDX hash, never substitute the ISO checksum. Source build is an additional state-changing operation requiring its own approval; no approved builder/image exists yet.

## First proposed target operation — BLOCKED pending fields above

After an approved prepared image exists, fill reviewed config at operator-selected absolute path (example `E:\Reviewed\ticketsim.json`), including its actual hash, approved paths, IP reservation and disposable approval. First run the existing entry point without apply for a read-only plan. The following **WOULD CHANGE THE HOST** and is not authorized:

```powershell
pwsh -NoProfile -File scripts/real-lab/Invoke-Operator.ps1 -ConfigPath E:\Reviewed\ticketsim.json -Operation provision -RequestId provision-0003 -Apply -Approval 'APPROVE GATE B provision provision-0003'
```

Expected: copied disk without overwrite, new immutable VM ID journaled, target off, fixed RAM and intended NICs configured. Failure: retain quarantine, journal and partial artifacts; reconcile by actual VM ID/disk paths. No automatic cleanup or retry; exact rollback/deletion requires separate approval. Do not use lab1 or recreate a switch.

Subsequent separate approvals: (1) first boot/console initialization of fresh identity, MAC-bound management IP, SSH host key/authentication and independent host HTTP checks; (2) cold baseline checkpoint with exact ID (fast reset only); (3) independent export to approved new backup path, hashes and baseline fingerprint; (4) import-as-copy drill with generated distinct ID and disconnected NICs before first boot, distinct MAC/IP before reconnect, timed console/SSH/HTTP/content/recovery verification without depending on guest SSH; (5) any reset demonstration, quarantine reconciliation/lease archival or cleanup. Each gets its own request ID, plan, expected result and failure quarantine. Preserve original backup. No approval for live fault injection or Start Real Lab follows from this proposal.
