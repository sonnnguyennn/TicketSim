# Real Lab Phase 0 security boundary

Phase 0 has no VM mutation path, guest shell, SSH credential or grading endpoint. `agent/server.mjs` serves one fixed status response from loopback and rejects foreign Host/Origin values. It has no child-process import or arbitrary command endpoint. This status is informational and is **not** proof that the agent, browser or host is secure. Local processes and browser extensions can still interact with loopback services.

## Required before enabling actions

1. Bind only to loopback, authenticate requests with short-lived session credentials, validate Origin/Host on HTTP and WebSocket upgrade, and defend against cross-site requests. Never accept PowerShell, script text or action arguments from the browser.
2. Run the agent without Administrator privileges by default. Put narrowly scoped host lifecycle operations behind a separate reviewed elevation boundary. Do not bundle keys, passwords or tokens in the SPA or repository.
3. Resolve an immutable target VM identity and controller ownership server-side. Reject ambiguous ownership and non-disposable VMs. An allowlisted manifest must bind exact VM profile, setup/check/rollback IDs and version.
4. Enforce an exclusive per-VM run lease and a durable event log. Recover from process/browser interruption by observing host state. Do not infer recovery from guest SSH success or failure.
5. Verify baseline and backup *before* fault injection. Verify that the fault was actually created *before* opening a learner session. Verify grading independently of the learner transcript. Verify reset from the host and block new runs on unknown/failed recovery.
6. Bound time, resource use and network reachability. Keep test faults away from the management channel. Redact credentials and private data from logs/evidence.

Regex filtering or a blacklist of shell words is not an execution boundary. Guided's regex classifier only selects authored fixture messages and must remain entirely disconnected from Real Lab execution.
