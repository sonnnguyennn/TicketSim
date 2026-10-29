# Operator diagnostic and future provisioning plan

## PM review closure

Use the separately approved operation proposal in [GATE_B_AUTHORIZATION_CHECKLIST.md](GATE_B_AUTHORIZATION_CHECKLIST.md). Switch existence and IDs are now operator-verified; exact VM NIC and host binding are pending. Source image/hash, final IP reservation and actual backup path remain UNKNOWN. Example paths/MACs are not operator-selected resources. Keep apply disabled until these fields are resolved and Product Owner authorizes an individual operation. The current tooling and all isolated checks leave real host/guest state untouched.

## Phase 1B-1 tooling (Gate A)

Review `scripts/real-lab/operator.example.json`, copy it outside the repo and fill actual switch IDs, allocation proof, source hash and operator-controlled paths. False approval flags/placeholders intentionally fail. Source must be an unattached, standalone, bootable Ubuntu 22.04 Gen2-compatible VHDX, max 20 GiB, independently obtained/verified; the tool does not download or install an OS. Prepare its Ubuntu/Nginx baseline manually on a separately approved disposable build environment and record package versions/image provenance. Never copy a disk attached to lab1. New VM ID remains null before creation, then must be copied from the actual provisioning result into the reviewed config.

Read-only plan command after inventory access is available:

```powershell
pwsh -NoProfile -File scripts/real-lab/Invoke-Operator.ps1 -ConfigPath E:\Reviewed\ticketsim.json -Operation provision -RequestId provision-0001
```

Future apply adds `-Apply -Approval 'APPROVE GATE B provision provision-0001'` **only after PO approves Gate B**. It creates a VM and copied disk without overwriting, fixes MACs and Gen2 Ubuntu secure-boot template, sets automatic start to Nothing and leaves VM off. It never configures host switches or guest networking. Console installation/static network/SSH key setup, first boot and baseline checks are explicit operator steps under that later approval. The actual ID is recorded in request results; a partial failure leaves files/VM quarantined. No automatic rollback/delete is safe: inspect recorded identity/artifacts, then propose exact cleanup separately. Repeated request IDs and existing names/paths fail instead of re-creating resources.

The tool reads Hyper-V inventory, source hash/VHD metadata and capacity in plan mode. It currently fails on this session's Hyper-V permissions. Gates are not bypassed by the example configuration. See PRIVILEGE_BOUNDARY.md for locks, authorization and residual qualification limits.

**Phase 1B-0 is read-only.** This procedure gathers evidence; it does not authorize a VM change. Run `scripts/real-lab-preflight.ps1` with a normal user account first and save its JSON outside the repository with the date, operator and host name. Do not run the agent as Administrator. Historical Phase 1A diagnostics remain below.

## Diagnose the current host without changing it

1. **Separate permission failure from guest failure.** A Hyper-V `Get-VM`/`Get-VMSwitch` access-denied result is a host authorization observation; it says nothing about guest boot or network. Multipass `list` reporting Running is a daemon/controller state, while `info` SSH timeout is a guest management-path failure. Do not interpret either one as proof of recovery readiness. A host operator with approved read access should repeat the same `Get-*` commands and record whether Hyper-V can identify `lab1` by immutable VM ID.
2. **Identify controller ownership.** Record `multipass version`, `multipass get local.driver`, `multipass list --format json`, the Hyper-V VM ID, VHD path and checkpoint inventory. A Multipass-listed name plus a VHD under its vault is evidence of likely Multipass management, but the operator must confirm lifecycle ownership before any action. Do not use Multipass and direct Hyper-V lifecycle commands on the same VM. Keep `lab1` unchanged.
3. **Inventory resources.** Record `Get-CimInstance Win32_OperatingSystem` memory figures, `Get-PSDrive -PSProvider FileSystem` free space, `Get-VMSwitch` switch types, and target VM CPU/RAM/disk attachment when read permission exists. Compare peak host headroom and worst-case backup plus disposable VM size; current free-space snapshots are insufficient by themselves. Microsoft documents `Get-VMSwitch` as a read-only inventory command and `Get-VMHardDiskDrive` as the attachment query. [Get-VMSwitch](https://learn.microsoft.com/en-us/powershell/module/hyper-v/get-vmswitch?view=windowsserver2025-ps), [Get-VMHardDiskDrive](https://learn.microsoft.com/en-us/powershell/module/hyper-v/get-vmharddiskdrive?view=windowsserver2025-ps).
4. **Verify a management path without guest SSH.** With appropriate read permission, inspect Hyper-V state, integration-service heartbeat, adapter and switch mapping. An operator may visually inspect VMConnect console/boot state without typing into the guest; document whether a console is reachable if SSH is broken. This is separate from probing SSH or HTTP. Do not change firewall, NIC or guest configuration during diagnosis.
5. **Document backup independently.** Locate an external VM export/backup and its creation time, target VM ID, disk set, storage location, restore instructions and integrity evidence. A checkpoint alone is not a separate backup. Inspect backup metadata and hashes read-only; do not claim restore works until a disposable restore drill is actually performed under a later authorization.
6. **Record Multipass driver lifecycle.** Installed Multipass is 1.16.1+win using `hyperv`. Canonical documents that `hyperv` becomes deprecated from Multipass 1.17 in favor of `hcs`, while existing installs may retain their setting. This is a forward compatibility risk, not permission to migrate `lab1`. Record the installed version/driver and review Canonical's migration guidance before any future change. [Canonical driver reference](https://canonical.com/multipass/docs/latest/explanation/driver/), [migration guide](https://canonical.com/multipass/docs/latest/how-to-guides/customise-multipass/migrate-from-hyperv-to-hcs-on-windows/).

## Operator-only plan for Phase 1B review

Prefer a **new dedicated disposable VM managed directly by Hyper-V**, if host access and resources support it. The operator should first reserve CPU/RAM/storage and select a controlled virtual switch. Record VM ID, image version, Nginx baseline, management console and SSH paths, and a backup stored independently of checkpoints. Before any fault injection, perform a documented restore drill on that disposable VM, verify the baseline fingerprint plus HTTP and management access, and show that recovery works when guest SSH is unavailable. Then review the exact allowlisted setup/fault/grade/recovery procedures and privilege boundary. These are future operator actions requiring separate approval; none is implemented or performed in Phase 1A.

**Phase 1B remains blocked** until controller ownership, dedicated VM, external backup, host-side restore and resource budget are independently verified and recorded. Do not repair, migrate or reconfigure `lab1` as a shortcut.

## Revised Phase 1B-0 decision

The later operator-supplied `lab1` evidence establishes a working static management endpoint (`eth1` `10.77.77.2/24`) and console access. It does not establish switch type/NIC mapping, persistent identity after replacement, ownership, backup or safe fault injection. The earlier Multipass `N/A`/timeout remains historical controller telemetry, not a verdict on this static SSH path. See [HOST_INVENTORY.md](HOST_INVENTORY.md) and [NETWORK_DESIGN.md](NETWORK_DESIGN.md).

For `ticketsim-lab`, inspect existing switches and VM adapters before proposing a switch. Prefer direct Hyper-V lifecycle control and a separate immutable VM ID. Reuse the dual-NIC arrangement only after mapping and subnet checks; if sharing the static subnet, allocate a different address after verifying availability. Document independent backup and host-owned restore proof per [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md). Phase 1B-1 remains **NO-GO** until those gates and a reviewed privilege/action boundary are met. No provisioning occurs in Phase 1B-0.
