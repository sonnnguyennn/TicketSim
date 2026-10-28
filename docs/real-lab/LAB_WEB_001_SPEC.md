# LAB-WEB-001 — Nginx unavailable (Ubuntu 22.04)

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
