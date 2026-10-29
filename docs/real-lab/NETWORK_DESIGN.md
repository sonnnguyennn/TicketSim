# Dual-NIC network design — Phase 1B-0

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
