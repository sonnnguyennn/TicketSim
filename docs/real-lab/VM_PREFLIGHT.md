# Windows VM preflight — read-only

Run from a normal PowerShell session:

```powershell
pwsh -NoProfile -File scripts/real-lab-preflight.ps1 -VmName lab1
```

The script emits JSON with `pass`/`fail`/`unknown` observations and `ready: false` by design. It reads OS/PowerShell versions; host memory, filesystem free space and Hyper-V switch inventory; Hyper-V module, target VM state/specification, adapters, VHD attachments and checkpoints; Multipass executable, version, driver, list and target instance information; and free space for an observed VHD volume when available. Multipass ownership is a heuristic, never an authorization decision. The script does not create, stop, restore, modify or delete a VM. It does not connect to the guest to run setup commands.

**Observed on 2026-10-29 (local client date):** Windows 11 Pro build 26200, PowerShell 7.6.5, Hyper-V module 2.0.0.0, Multipass executable present with `local.driver=hyperv`. `multipass list --format json` reports `lab1` as Running with Ubuntu 22.04 LTS but IPv4 `N/A`; this is a management-plane report, not a verified healthy guest. `Get-VM lab1` returned a permission error for host `SONNGUYEN`, so Hyper-V VM state, adapters, VHD, checkpoints and capacity remained unknown. `multipass info lab1` timed out connecting to `lab1.mshome.net`; guest connectivity and ownership remain unverified. No VM state was changed. The preflight output should be rerun by a host operator with appropriate read permissions before deciding ownership. Do not use the previously supplied invalid IPv4 `172.26.296.27`.

Before Phase 1, the operator must identify a dedicated disposable VM, its sole controller, host-side backup and tested restore path, adequate disk/RAM, and a management path that works even when guest SSH fails. Existing checkpoints are not equivalent to an independent backup. `lab1` must remain untouched until its ownership and purpose are confirmed.

**Phase 1A read-only repeat:** Multipass 1.16.1+win still reports `local.driver=hyperv`; `lab1` appears Running with IPv4 `N/A`, while `multipass info` cannot connect. Host observations were 16,538,236 KiB total visible RAM, about 3,492,864 KiB free at the sampled instant, C: about 25.3 GB free and E: about 77.2 GB free. Hyper-V VM and switch reads returned permission errors, so controller ownership and backup capacity remain unknown. These values fluctuate and do not constitute a sizing approval. The script now reports `possibly-multipass-managed` from the Multipass list, explicitly with `status: unknown`.

See [VM_PROVISIONING_PLAN.md](VM_PROVISIONING_PLAN.md) for the operator procedure and Phase 1B gates.
