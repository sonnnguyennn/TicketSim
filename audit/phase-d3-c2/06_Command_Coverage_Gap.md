# Command Library coverage decisions

The 21 IDs below have no direct initial Guided probe link. That does not make them unused: search, Quick Lookup and safety references remain valid entry points. None is removed, merged, or renamed.

| Command ID | Decision | Support value / reason for no default Guided probe |
|---|---|---|
| `nmcli-show` | KEEP_CORE | Inspect active NetworkManager connection profile before changes. |
| `resolvectl` | KEEP_CORE | Distinguish system resolver state from a direct `dig` lookup. |
| `systemctl-start` | KEEP_SAFETY_REFERENCE | State-changing service action needs approval and rollback context. |
| `journal-vacuum` | KEEP_SAFETY_REFERENCE | Destructive log retention operation, not a first check. |
| `ip-route-add` | KEEP_SAFETY_REFERENCE | State-changing route edit can cut remote management. |
| `registrar-change` | KEEP_SAFETY_REFERENCE | Provider/registrar workflow needs owner and SOP. |
| `hostnamectl` | KEEP_CORE | Host identity and OS context, read-only form. |
| `sshd-test` | KEEP_CORE | Validate config before restart; distinct from checking daemon state. |
| `nmcli-device-show` | KEEP_CORE | Interface-specific NetworkManager details. |
| `nc-port` | KEEP_CORE | Targeted TCP port check; Ncat/OpenBSD syntax and output need lab pinning. |
| `tcpdump-ssh` | KEEP_ADVANCED | Packet capture is useful but needs privacy/traffic scope. |
| `firewall-state` | KEEP_CORE | Firewall daemon state differs from active-zone rules. |
| `firewall-zones` | KEEP_CORE | Active/default zone mapping is needed for rule interpretation. |
| `nft-rules` | KEEP_ADVANCED | Inspect nftables rules after simpler firewall checks. |
| `uptime` | KEEP_CORE | Load and uptime context before blaming a subsystem. |
| `nmcli-dns` | KEEP_CORE | DNS configured on a connection versus resolver result. |
| `virsh-list` | KEEP_ADVANCED | Hypervisor-side inventory; requires provider authority. |
| `systemctl-restart` | KEEP_SAFETY_REFERENCE | Disruptive service action, only after safe validation. |
| `nmcli-down` | KEEP_SAFETY_REFERENCE | Can sever the only remote path. |
| `rm-rf` | KEEP_SAFETY_REFERENCE | Destructive command; safety/authorization reference only. |
| `virsh-destroy` | KEEP_SAFETY_REFERENCE | Hard power action on hypervisor; provider owner only. |

## Evidence-backed possible additions

| Candidate | Practical gap | Related case | Priority | Decision |
|---|---|---|---|---|
| `blkid` | Confirms filesystem UUID/type when an `/etc/fstab` entry and block-device names disagree; `lsblk`/`findmnt` do not always expose the needed identifier together. | VPS-06-005 | Medium | Propose one read-only card after SME and distro review; no ID added in C2. |
| `chronyc tracking` / `chronyc sources` | Distinguishes guest clock offset and synchronization source when time drift is suspected; `timedatectl` alone does not show chrony measurements. | VPS-10-008 | Medium | Propose scoped card after verifying chrony is installed on supported image. |

No merge/removal candidate is justified by current evidence. Similar looking cards cover different layers or safe versus change operations.
