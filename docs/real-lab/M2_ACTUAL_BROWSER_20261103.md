# M2 actual browser qualification — operator/user evidence, 2026-11-03

## Evidence and attribution

The operator/user supplied three actual Chrome screenshots and stated that all requested checks were OK, then supplied actual read-only `sudo -l` output. These are actual-user observations of the original, not the isolated transport harness.

Directly visible in screenshots:

- Local Real Lab at `127.0.0.1:4174/#real-lab`, terminal-only mode with fault/reset locked.
- Actual preflight **PASS**, displayed at 08:20:42 Asia/Saigon.
- Connected Ubuntu SSH PTY as `lab@ticketsim-lab`; `hostname` returned `ticketsim-lab`.
- `id` returned uid/gid 1000 (`lab`), including sudo group 27; `tty` returned `/dev/pts/0`.
- Genuine guest handling of input: a typo with Vietnamese characters produced the real systemd invalid-unit message, followed by the corrected status command.
- Nginx `active (running)`; pager reached `(END)` and returned to the shell prompt.
- Fixed website test returned HTTP **200**, exact content **Khớp**, `TicketSim LAB-WEB-001 baseline v1`, displayed at 08:22:25 Asia/Saigon.

User subsequently ran `sudo -l` in the web terminal and supplied:

```text
User lab may run the following commands on ticketsim-lab:
    (ALL : ALL) ALL
```

This establishes authorization to repair Nginx without actually changing it for a permission test. The password was entered by the user directly in the terminal and was not supplied to Codex.

The user's “đã check và oke toàn bộ” is recorded as operator/user confirmation of the requested remaining M2 interactions, including refresh/reconnect and terminal controls. The screenshots themselves are not claimed as independent captures of every one of those interactions. No automated transcript or raw keystrokes were collected.

## M1 linkage and remaining gate

The successful operator launch reported `SONNGUYEN\Admin` elevated/Hyper-V-readable PASS and reached the script's final “Opened secure pilot” message. That message is reached only after the restricted Agent probe, actual Agent Node owner, protected code hashes and HTTPS readiness checks. The protected detailed record is `C:\ProgramData\TicketSimPilot\operator\m1-evidence.json`; Codex's ordinary process is correctly denied access to it. The M3 launcher must read and validate that protected record again under the Operator principal before arming.

Actual HTTPS status was independently observed with `phase=terminal_only`, `secureTransport=true`, `terminalEnabled=true`, `actionsEnabled=false`. Successful web guest authentication is also consistent with the fixed pinned-host verifier in the deployed code. B5 provides the original host-key/checkpoint qualification; M3 still rechecks actual identities, backup and resource invariants.

## Outcome

M2 is **operator/user-verified on the actual original** for the browser workflow above. No first-trial claim, fault, grade or checkpoint recovery is asserted by this qualification. M3 requires fresh journal/lease/host checks and separate explicit operator consent for the one fault and its recovery; M4 remains deferred.
