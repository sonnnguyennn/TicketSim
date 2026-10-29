# Real Lab security boundary

Historically, Phase 0 had no VM mutation path, guest shell, SSH credential or grading endpoint; the server served status only. Phase 1A added authenticated **mock-only** runs and grading. Phase 1B-0 adds a server-owned VM profile contract and pure endpoint checks, still without a host execution path. Local processes and browser extensions can interact with loopback services; neither status nor successful mock runs prove host safety.

## Required before enabling actions

1. Bind only to loopback, authenticate requests with short-lived session credentials, validate Origin/Host on HTTP and WebSocket upgrade, and defend against cross-site requests. Never accept PowerShell, script text or action arguments from the browser.
2. Run the agent without Administrator privileges by default. Put narrowly scoped host lifecycle operations behind a separate reviewed elevation boundary. Do not bundle keys, passwords or tokens in the SPA or repository.
3. Resolve an immutable target VM identity and controller ownership server-side. Reject ambiguous ownership and non-disposable VMs. An allowlisted manifest must bind exact VM profile, setup/check/rollback IDs and version.
4. Enforce an exclusive per-VM run lease and a durable event log. Recover from process/browser interruption by observing host state. Do not infer recovery from guest SSH success or failure.
5. Verify baseline and backup *before* fault injection. Verify that the fault was actually created *before* opening a learner session. Verify grading independently of the learner transcript. Verify reset from the host and block new runs on unknown/failed recovery.
6. Bound time, resource use and network reachability. Keep test faults away from the management channel. Redact credentials and private data from logs/evidence.

Regex filtering or a blacklist of shell words is not an execution boundary. Guided's regex classifier only selects authored fixture messages and must remain entirely disconnected from Real Lab execution.

## Phase 1A controls and limits

The agent binds `127.0.0.1` and checks the actual listener port in `Host`, exact allowed local Origins and the loopback peer address. It rejects all WebSocket upgrades. A random, 5-minute, one-time pairing code is printed only to the local agent terminal. Pairing returns a random bearer token valid for 15 minutes; the token is never bundled into Vite, written to SQLite, stored in browser progress or set as a cookie. Every mock write requires an allowed Origin, bearer token, JSON body matching an exact schema and an idempotency key. Read-only run history also requires the bearer token. Test coverage includes foreign Host/Origin, absent token, expired pairing/session, invalid body/method, unknown scenario and WebSocket rejection.

The request path exposes **mock runs only**. `POST /api/v1/mock-runs` accepts only a scenario ID; its target is bound in the server registry to `mock:web:001`. The manifest references fixed mock action IDs, and unknown IDs are rejected. Event metadata is restricted to `simulated`, check ID, outcome, score and fixed error code, so arbitrary notes or credentials cannot be persisted through that API. No child-process, SSH, PowerShell, Hyper-V or Multipass module is imported into the agent.

These controls do not make localhost a universal trust boundary. Any local process can spoof an Origin header; pairing-code secrecy and OS account security matter. A browser extension with access to the permitted app origin may read an in-memory bearer token if a future UI stores one. The token is lost on agent restart and there is no real VM operation route, so this Phase 1A mechanism is **not approval for privileged VM control**. Before Phase 1B, re-review authentication, elevation separation, durable recovery authorization, logging/redaction, rate limits and WebSocket handshake protection in the actual runtime.

## Phase 1B-0 protected reference VM

The `lab1` profile records observed static management networking only. Its mode is `reference-only`, disposable approval is false, scenario allowlist empty and recovery evidence absent. `assertRealMutationAllowed` rejects `lab1` by immutable ID or name and rejects every other real mutation because real actions remain disabled. Neither an SSH login nor an open TCP port grants mutation authority. The mock registry accepts only `mock:web:001` bound to its synthetic profile; client requests cannot substitute the reference profile.

Before future execution, a trusted collector must freshly bind the immutable VM ID, expected NIC MAC/interface and exact switch ID; confirm static address uniqueness; verify SSH host key and authentication; and independently verify backup, baseline and host recovery. Each signal is separate and unknown blocks execution. Preserve management and console access during fault design; never place Nginx faults on SSH, routing, firewall or the management NIC. See [NETWORK_DESIGN.md](NETWORK_DESIGN.md) and [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md).
