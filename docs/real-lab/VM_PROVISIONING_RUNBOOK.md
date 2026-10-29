# ticketsim-lab — manual ISO installation runbook

Status: future operator procedure, **Gate B NOT AUTHORIZED**. No command or UI action below has been executed. Only the new dedicated ticketsim-lab may be changed. Never select lab1, its disks/checkpoints, MACs or identity. The local agent remains non-administrator and real Start Lab disabled. Record date/operator/request ID, approvals, actual VM ID, actions/results and failure evidence outside public assets; no secrets in logs.

## 1. Read-only preflight and approval

Obtain Product Owner approval for each stage in GATE_B_AUTHORIZATION_CHECKLIST.md. Before creation: sustained >=4GiB host free RAM (2GiB guest +2GiB reserve), approved storage/backup destinations, growth budget including ISO, and reserved unique IP/MACs. Current RAM3.63GiB and missing backup block execution. Candidate 10.77.77.3 is not reserved. Check static allocation records, DHCP leases/reservations, all VM NIC/IPs and neighbor evidence; failed ping is insufficient.

**READ-ONLY PowerShell** (operator with approved Hyper-V read access):

```powershell
Get-VM | Select-Object Name,Id,State,MemoryAssigned,MemoryStartup,DynamicMemoryEnabled
Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory
Get-Volume | Select-Object DriveLetter,UniqueId,SizeRemaining,Size
Get-Partition | Where-Object DriveLetter -In @('C','E') | Select-Object DriveLetter,DiskNumber
Get-VMSwitch | Select-Object Name,Id,SwitchType
Get-VMNetworkAdapter -All | Select-Object VMName,VMId,MacAddress,SwitchName,SwitchId,IPAddresses
```

Resolve exact destination paths and permissions, absence of ticketsim-lab name/VHD/config and no overlap with existing VM files. Proposed VM root E:\TicketSimVMs\ticketsim-lab, new disk E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx; neither is approved yet. Backup/drill locations remain separate decisions. Do not stop or reduce other VMs to pass preflight.

## 2. Obtain and authenticate ISO (preparation approval required)

**FILESYSTEM CHANGES ONLY, future operator:** download from [Canonical release directory](https://releases.ubuntu.com/22.04.5/) the ISO ubuntu-22.04.5-live-server-amd64.iso, SHA256SUMS and SHA256SUMS.gpg to a newly approved staging directory (proposed E:\TicketSimImages). Do not overwrite files. Include staging bytes in capacity. No prepared VHDX/build VM is required for this manual path.

Use an existing approved GnuPG installation; if absent, arrange verification tooling separately. Follow [Canonical's verification procedure](https://ubuntu.com/tutorials/how-to-verify-ubuntu) to retrieve the Ubuntu CD-image signing key and independently check its full fingerprint. A short key ID or an untrusted good-signature message alone is insufficient. From the staging directory, **VERIFICATION commands** (GPG may initialize/update its user trust database; no VM changes):

```powershell
gpg --verify SHA256SUMS.gpg SHA256SUMS
Get-FileHash -Algorithm SHA256 -LiteralPath E:\TicketSimImages\ubuntu-22.04.5-live-server-amd64.iso
```

Require authenticated manifest signature and exact matching ISO entry. Previously fetched official published SHA256: `9bc6028870aef3f74f4e16b900008179e78b130e6b0b9a140635434a46aa98b0`. Retain signed manifest, fingerprint/signature result, local hash, file length and source URL. Local ISO verification is currently UNKNOWN; stop on mismatch. This checksum is for ISO only, never the installed VHDX.

## 3. Create through Hyper-V Manager (HOST CHANGES, approval B1)

Use operator elevation for Hyper-V Manager, not the Local Agent. Select SONNGUYEN; New → Virtual Machine. Set name ticketsim-lab, approved dedicated location, Generation2, 2048MB startup RAM, Dynamic Memory unchecked, Default Switch initially. Create a **new** dynamically expanding20GiB VHDX at the approved absent path; do not choose an existing disk. Select the verified ISO as boot DVD. Uncheck automatic start after creation.

Before first boot, Settings: 2 virtual processors; Secure Boot template Microsoft UEFI Certificate Authority; automatic start Nothing; record the new immutable VM ID. Add second NIC named management on existing Lab-Static. Confirm switch IDs against inventory, assign approved unique static MACs to both NICs, record name/MAC/switch map. Never reuse 525400563E97 or 5254009B8693. Leave VM off for review. [Microsoft Ubuntu support](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/supported-ubuntu-virtual-machines-on-hyper-v).

On **new VM only**, disable automatic checkpoints in its Checkpoints settings before installation. This prevents unbudgeted automatic branches and allows a clean cold export before the separately approved fast baseline checkpoint. Record settings; never change lab1 checkpoint settings.

Expected result: one new off Gen2 VM and independent blank disk, correct CPU/RAM/NIC settings. On any mismatch/partial failure, quarantine the new target and record actual ID/artifacts; do not rerun creation or delete anything automatically. Any cleanup needs exact separately approved paths/ID. No lab1 checkpoint consolidation or switch modification.

## 4. Install via VMConnect (HOST/GUEST CHANGES, approval B2)

Open console for the recorded new ID, boot ISO, use Ubuntu Server installation. During installation use only the Default Switch-side NIC for DHCP/package access; leave the management NIC unconfigured until matching it by MAC. Verify installer disk is the new20GiB VHDX. Choose the ordinary server installation, no extra workloads; create hostname ticketsim-lab and a new named user (examples below: laboperator) with unique credentials. Enable OpenSSH; do not import/copy lab1 host keys, machine-id, disks or user credentials. Installer partitions/formats only the new disk.

After completion, detach the ISO from the new VM's virtual DVD and boot its installed UEFI disk via console. Confirm boot/console before attempting SSH. Record /etc/os-release, hostname, machine-id hash, SSH public host-key fingerprint and actual NIC MACs. Do not log private keys/passwords. If install/boot fails, preserve console errors and quarantine; diagnose only the new target under approval.

## 5. Identify NICs and configure management (GUEST CHANGES, B2)

**READ-ONLY in new guest console:**

```sh
hostnamectl
cat /etc/os-release
ip -br link
ip -4 -br addr
ip -4 route
sudo netplan get
```

Match guest MACs to the new VM's Hyper-V adapters; interface names need not be eth0/eth1. Never infer ordering. Inspect existing /etc/netplan YAML and ensure only one effective definition matches each adapter. Preserve the installer DHCP configuration on the Default Switch NIC. Back up only the new guest's network files before editing. Add management config to /etc/netplan/60-ticketsim-management.yaml; replace the placeholder with **new target's approved management MAC**. Address below may be used only after .3 reservation; substitute the final approved address if different.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    labmanagement:
      match:
        macaddress: "REPLACE_WITH_NEW_VM_MANAGEMENT_MAC"
      dhcp4: false
      dhcp6: false
      accept-ra: false
      addresses: [10.77.77.3/24]
      optional: true
```

**STATE-CHANGING on new guest only:** save YAML with root ownership/mode600, run `sudo netplan generate` (writes generated config), then `sudo netplan try --timeout 120` from VMConnect. Confirm only if correct management address, DHCP default route on package NIC and console are sound. No management default gateway/DNS, host NAT or firewall edits. If try times out/reverts, inspect actual state from console; restore saved new-guest YAML under approval. Do not assume automatic rollback always succeeded. [Netplan examples](https://netplan.readthedocs.io/en/0.106/examples/).

## 6. SSH and Nginx baseline (GUEST CHANGES, B2)

Install/update package metadata and packages on **new guest** through package NIC, record exact installed versions; no invented version pin:

```sh
sudo apt-get update
sudo apt-get install openssh-server nginx
sudo systemctl enable --now ssh nginx
printf 'TicketSim LAB-WEB-001 baseline v1\n' | sudo tee /var/www/html/index.html
```

**DIAGNOSTIC commands** (new guest): `systemctl is-active ssh nginx`, `sudo nginx -t`, `dpkg-query -W nginx openssh-server`, `sha256sum /var/www/html/index.html`, `curl --fail --max-time 5 http://127.0.0.1/`, `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`. Save exact package versions/config/page hash as baseline. nginx -t may access logs; none of these commands are executed by TicketSim. Pin/reproduce versions from this recorded baseline before later live runs.

**Windows validation** (network probes, first SSH connection writes local known_hosts; only after B2 approval and actual .3 assignment):

```powershell
Test-NetConnection 10.77.77.3 -Port 22
ssh -o StrictHostKeyChecking=ask laboperator@10.77.77.3
$page = Invoke-WebRequest -Uri http://10.77.77.3/ -TimeoutSec 5
$page.StatusCode
$page.Content -ceq "TicketSim LAB-WEB-001 baseline v1`n"
```

Compare the offered full SSH fingerprint with VMConnect output **before** accepting; never bypass host-key checking. Record successful authentication separately from TCP22. Require HTTP200 and exact page bytes from host, not just service-active/local curl. Verify independent console still works. Observe management MAC/IP/default route after one separately approved restart; DHCP churn on package NIC must not change management endpoint. No restart is authorized by this document.

## 7. Baseline, recovery and handoff (separate approvals)

Record immutable VM ID, OS/user identity, actual NIC/switch/MAC/IP mapping, SSH fingerprint, package versions, config/page hashes, host HTTP/SSH evidence and console state. Shut down the **new** target cleanly only under approval; obtain baseline/checkpoint approval separately. Follow BACKUP_RECOVERY.md for independent cold export and isolated restore-copy drill. Keep the pilot unavailable until actual backup and timed host-owned recovery without guest SSH are demonstrated. Failed/unknown checks quarantine the target; no automatic cleanup or success claim.

Prepared-VHDX scripts remain an optional advanced path and are unchanged. Do not call their provision operation for this manual ISO path. If later using their checkpoint/backup/reset/restore-copy functions, first supply actual new VM ID, approved config/paths and required source artifact/hash; their existing prepared-source preconditions still apply. Otherwise use separately approved Hyper-V Manager recovery procedure. No automatic ISO installer is added.
