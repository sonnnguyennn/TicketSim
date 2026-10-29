# Phase 1B-0 QA — 2026-10-29

Status: implementation and planning update complete; stop for PM review. Phase 1B-1 is **NO-GO** pending operator gates. Source inputs: supplied Master Plan v2 and Phase 1B-0 update; operator evidence is distinguished from local observations in [HOST_INVENTORY.md](HOST_INVENTORY.md).

## Findings and decision

The supplied successful SSH login resolves uncertainty about Windows reaching the configured static `lab1` endpoint: `eth1` `10.77.77.2/24`, MAC `52:54:00:9b:86:93`, host source `10.77.77.1`. Local read-only probes confirmed host address/route/adapter and TCP/22 reachability. Dynamic `eth0` is not used for stable SSH. Historical Multipass `N/A` and timeout remain recorded. Hyper-V queries still return access denied in this session; exact switch mapping, controller ownership, SSH host key and reboot persistence remain UNKNOWN. No real SSH authentication was rerun in this session.

The future target remains a separate Hyper-V-owned `ticketsim-lab` with distinct IP after availability checks. Independent backup, host-side restore without SSH, baseline fingerprint and disposable approval are absent. No lab1 mutation, live fault, restore, restart, switch/Netplan/firewall change, agent elevation or Start Real Lab was performed/enabled.

## Changes

- Added server-owned JSON Schema v1, TypeScript contract, protected lab1 reference and synthetic mock profiles. Static management and dynamic NICs, identity/controller, MAC/switch/host key, IP policy, scenario authorization, privilege policy, baseline and recovery proof are separate fields.
- Added pure pass/fail/unknown endpoint verification; only complete fresh synthetic evidence passes mock preflight. Real readiness is always false. Missing collectors are explicitly deferred; profile data is not live evidence. Protected lab1 and all real mutations are rejected.
- Integrated profile binding and mock endpoint checks into registry/service. Restart keeps interrupted runs recovery-required and leases unknown, including missing connectivity.
- Expanded read-only preflight with host network inventory and optional IPv4 TCP/22 probe. Added a plan-only operator script for provision/backup/restore-drill; it emits review steps and cannot execute mutations.
- Updated architecture, security, preflight, provisioning, pilot spec and roadmap; added host inventory, network design and recovery gates. Original 112 tickets, answers, 122 command cards, Guided engine and progress v5 have no semantic changes. Four pre-existing untracked audit files are preserved.

## Verification

| Check | Result |
|---|---|
| `npm run prepare-data` | PASS: 112 tickets, 112 Guided cases |
| `npm run audit:content` | PASS: 0 errors; 112 Guided, 122 commands |
| `npm test -- --run` | PASS: 93 tests, 14 files |
| `npm run build` | PASS; existing bundle-size advisory remains |
| `npm run test:browser` | PASS: 51 tests |
| PowerShell parser | PASS: read-only preflight; plan emitter checked separately |

New cases cover correct endpoint, wrong VM ID/controller/MAC/interface/IP/switch, duplicate IP, disconnected NIC, TCP/SSH unavailable, auth failure, stale/missing observation, dynamic address rotation, absent recovery, schema/privilege errors and lab1 mutation rejection. Existing restart test now also checks missing connectivity preserves quarantine. Node reports its existing experimental SQLite notice.

## Operator follow-up

Read-only commands still required are listed in [HOST_INVENTORY.md](HOST_INVENTORY.md). Approved guest inspection may capture `ip -4 -br addr`, `ip -4 route`, `networkctl status eth1 --no-pager`, `systemctl is-active ssh` and `sudo netplan get`; avoid collecting secrets. Do not reboot to test persistence in this phase. For plan review only, run `pwsh -NoProfile -File scripts/real-lab-operator-plan.ps1 -Operation provision` (or `backup`, `restore-drill`). No apply mode exists. PM must review the completed plan before separately authorizing Phase 1B-1.
