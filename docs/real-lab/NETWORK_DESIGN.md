# Dual-NIC network design — Phase 1B-0

## PM review closure update

Operator elevated evidence confirms both Internal switches: Lab-Static `4277a35c-217f-4096-a1a9-a691975f150f`, Default Switch `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444`. Example config now records these observed IDs while `SwitchMappingVerified` remains false. Intended new management NIC would reuse Lab-Static; intended package-access NIC would use Default Switch. Exact lab1 MAC-to-switch and host binding still require clean operator output, so this is a proposed target binding, not completed verification. Candidate `10.77.77.3` remains unallocated/unreserved; no MAC/IP selection is final until collision checks and allocation record exist.

Keep static 2 GiB RAM for the first pilot; Dynamic Memory is deferred until representative workload and minimum/maximum/ballooning behavior are measured. Minimum/maximum settings are not used while Dynamic Memory is disabled. Lowering minimum RAM cannot satisfy a 2 GiB startup plus 2 GiB host reserve. Provisioning code now explicitly disables Dynamic Memory in future apply. No existing VM setting is changed. Disk budgets include base (20 GiB), one checkpoint/AVHDX growth (20 GiB), restore copy (20 GiB), plus 10 GiB headroom on shared VM/drill volume, and at least 30 GiB on an independent backup volume. More checkpoints or expanded disks require a fresh budget and review; transient free space alone is insufficient.

## Phase 1B-1 proposed target

Propose `ticketsim-lab`: 2 vCPU, fixed 2 GiB startup RAM, standalone dynamically allocated VHDX with maximum 20 GiB. Budget maximum disk size, not just current file size; reserve 10 GiB overhead per destination and space for base disk, one checkpoint growth budget and drill when sharing a volume. Use independent backup volume (example F is a placeholder, not observed hardware). Current RAM headroom is below tooling threshold; host operator must make capacity available without this phase stopping any VM.

Candidate management IP `10.77.77.3/24` is **UNRESERVED/UNKNOWN**, not approved for use. Example locally administered MACs are proposals requiring collision checks. Existing internal switch reuse is preferred only after exact mapping is verified. Alternative separate subnet/switch remains an operator design decision; tools never change global host networking. NAT/default-side interface may rotate DHCP addresses; management remains static via MAC-bound Netplan, with no default route on that NIC. Actual guest interface names must be observed on the new VM, not copied blindly from lab1.

After later authorized startup/restart, recheck immutable VM ID, NIC MAC/interface, switch ID, static IP/prefix, duplicate allocation, host route, host-key pin and SSH authentication separately. NIC replacement requires profile review; never silently accept a new MAC/key. Reboot persistence test is Gate B only. IP conflict or DHCP churn on management quarantines execution. NAT DHCP changes alone do not select a new SSH endpoint.

```text
Windows SONNGUYEN
  vEthernet (Lab-Static), 10.77.77.1/24
             │ observed routed/reachable path; exact Hyper-V switch mapping UNKNOWN
  lab1       ├─ eth1 10.77.77.2/24, MAC 52:54:00:9b:86:93 (static management)
             └─ eth0 172.22.122.192/20 (dynamic Default Switch side)
```

**VERIFIED (operator-supplied):** `eth1` is UP and Netplan config uses `networkd`, MAC match, DHCPv4/v6 disabled and `optional: true`; Windows SSH login to `10.77.77.2` succeeded; VMConnect console worked. **VERIFIED (this session):** host `10.77.77.1/24` and TCP/22 reachability. **INFERRED:** `vEthernet (Lab-Static)` may connect to the static NIC. **UNKNOWN:** actual Hyper-V switch ID/type and VM adapter to guest interface mapping, SSH host key, IP behavior after NIC replacement or reboot, and other potential users of the subnet.

The static guest address is profile data for `lab1`, not a global default. The dynamic `eth0` address may rotate without failing an otherwise sound management endpoint. A future trusted collector must check immutable VM ID, adapter MAC/interface, switch ID/type, static address/prefix, current address ownership, TCP/22, SSH host key and authentication separately. A successful TCP connection alone proves only reachability at that instant. Missing observations remain `unknown` and block execution.

**Future target, not provisioned:** prefer a separate disposable `ticketsim-lab` directly managed by Hyper-V, with its own immutable VM ID and dual NICs if the existing network is suitable. If it shares `10.77.77.0/24`, reserve and verify a different unused static IP; never reuse `10.77.77.2`. First inspect existing switch type and NIC mapping with approved read-only Hyper-V queries. Do not assume a new switch is needed. Confirm host-side console/recovery independent of SSH. No switch, guest network or firewall changes are authorized in Phase 1B-0.
