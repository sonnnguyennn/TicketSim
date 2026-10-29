# LAB-WEB-001 — Nginx unavailable (Ubuntu 22.04)

## Phase 1B-1 baseline preparation

Prepared read-only guest probe: `scripts/real-lab/verify-baseline.sh` (Ubuntu 22.04, installed package versions, SSH/Nginx active, test page SHA256, local HTTP). Run only on future approved target; it has not run on lab1. Record the exact installed nginx/openssh versions and source image SHA256 before approval; versions remain UNKNOWN until baseline exists. Use deterministic page bytes `TicketSim LAB-WEB-001 baseline v1` plus newline; pin its hash in baseline evidence. Operator must also use an independent host HTTP request to the actual reserved management IP and compare HTTP 200 and exact bytes, pin/verify SSH host key then authenticate, and validate independent recovery artifact. Local curl/service-active alone cannot pass.

Future reviewed fault design: stop only the guest nginx service after all gates and lease acquisition; independently check expected HTTP failure while SSH remains available. Grade by guest config validity, correct Nginx version/service and independent HTTP content/status. Restore from exact reviewed baseline and repeat host probes. These are procedure designs only; no fault executor or live Start Lab control is added.

**Status:** mock-only pilot specification. `agent/registry.mjs` contains a server-owned manifest using mock action IDs. No real setup or recovery script exists. Related learning seed: `VPS-03-001`; its CentOS Guided fixtures and answer key remain separate.

## Learner-visible ticket

> Website is unavailable over HTTP. The server itself remains reachable through the lab's SSH management path. Investigate the application service and restore the expected page when authorized. Explain how you verified the result.

The live pilot must use a dedicated disposable Ubuntu 22.04 VM with Nginx package/version pinned and a deterministic test page at a named HTTP endpoint. The management SSH path and host-side console/recovery channel must remain available throughout. No public Internet target is needed.

## Planned scenario stages

| Stage | Required evidence/behavior |
|---|---|
| Baseline | Ubuntu image, Nginx installed, valid config, known test page and HTTP response, SSH and host console reachable; independent backup and reset fingerprint recorded. |
| Setup/fault | After authorization and baseline verification, create *only* the Nginx-service-unavailable condition in the disposable guest. Do not alter SSH, firewall, routing or host network. The real action is not implemented in Phase 1A. |
| Fault verification | Independently observe Nginx service state and failed HTTP request to the expected endpoint while SSH still works. If fault check is inconclusive, do not open the learner run. |
| Investigation | Learner may choose any safe diagnostic sequence. Capture service state, recent logs, config validation and local/external HTTP evidence; do not require one exact command. |
| Grading | Check Nginx installed/config valid, service operational, correct expected HTTP content/status from an independent client, SSH management preserved, and learner's verification note/evidence. Service-active alone cannot pass. `UNKNOWN` stays distinct from `FAIL` when a check cannot run. |
| Recovery | Host-owned restore to a separately verified baseline; verify fingerprint, HTTP page, SSH management and VM state. Failed/unknown recovery keeps the VM lease blocked. |

## Safety and scoring design

The eventual live manifest must name reviewed preflight/setup/fault/grade/recovery IDs, exact target VM binding, maximum duration, resource limits and safety policy. It must prohibit arbitrary scripts and preserve a host-side path when SSH fails. Proposed score: functional HTTP 45, evidence/reasoning 20, independent verification 20, safe process 10, time 5. This is a design rubric, not implemented grading. Full credit depends on observed outcome and evidence, not a particular `systemctl` command. The current mock grader only checks fake HTTP/config/SSH booleans and produces a simulated score; it does not evaluate learner notes or prove a real repair.

## Phase 1B-0 network and target binding

The real pilot target is a **future** `ticketsim-lab`, never `lab1`. Its server-owned profile must bind a different immutable VM ID, direct Hyper-V controller, verified static management NIC/IP/MAC/switch, a separately observed dynamic/default NIC, and a unique address if it shares `10.77.77.0/24`. A fresh endpoint check must distinguish static configuration, TCP/22, SSH host key, authentication, disposable approval and recovery proof before any future run. `eth0` address changes do not select a different SSH endpoint. The current `LAB-WEB-001` registry entry binds only the synthetic mock profile and cannot target `lab1`; fault injection remains disabled.
