# M4 packaging pickup — 2026-11-03

Prerequisite achieved: [actual M3 PASS](M3_ACTUAL_PASS_20261103.md). Product target: install/configure once with Windows authorization, then open a shortcut and complete normal learning and supported operator tasks in the browser. The browser terminal remains the fixed Ubuntu guest PTY; it must not expose a Windows shell.

PM's HyperV_TicketLab proposal is analyzed in [integration review](HYPERV_TICKETLAB_INTEGRATION_REVIEW_20261103.md). Recommended scheduling: shared M4 lifecycle/approval foundations → qualify post-B5 guest bootstrap → port 02/03/07 sequentially → complete packaging. This recommendation is not approval for new live mutations or a replacement of the consumed M3 permit.

## Ordered implementation

1. **Freeze installation contract.** Inventory the tested Node/PowerShell distributions, protected code hashes, account/certificate/state ownership and existing host manifest. Pin distributable versions, checksums and licenses before bundling. Package the app separately from this host's existing VM/checkpoint/backup; do not clone/import/provision a VM or create a checkpoint implicitly.
2. **Manage runtime lifecycle.** Qualify a Windows service mechanism with a standard Agent identity and distinct Operator authority. Add install, health, start, stop and repair with exact executable/service ownership checks. Stop/upgrade must refuse active, unknown or quarantined work. Preserve the consumed admission and completed databases; do not bypass the pilot refresh guard or stop the current Trial runtime using the terminal-only helper.
3. **Provide launcher and browser diagnostics.** A desktop shortcut opens the trusted loopback HTTPS origin with authenticated pairing; service startup must not open consoles. Show clear readiness, identity/access failures, certificate issues and recovery state without exposing secrets. Privileged installation/repair still uses Windows authorization; learner sessions do not acquire administrative rights.
4. **Finish browser operator controls.** Present exact target/action/effect/recovery and bounded approval scope to an authenticated Operator. Persist approvals with expiry, journal evidence and no ambiguous replay. Keep learner and Operator authority distinct. A consumed first-trial permit cannot become a reusable authorization. Any future actual VM-changing acceptance needs its own scoped approval.
5. **Preserve progress and clarify results.** Retain all 112 tickets and progress. Add explicit validated export/import migration from the old browser origin, without assuming localStorage crosses origins. Label prior website observations and invalidate or clearly distinguish them when grading/recovery changes the environment. Separate functional checks from the quality of the learner's evidence note.
6. **Deliver repeatable distribution.** Produce a versioned package, integrity manifest and third-party notices. Upgrade preserves state and rolls back code without replaying operations; uninstall removes only owned app components and preserves learner data, VM and backup by default. Include a concise install/open/repair guide.

## Acceptance

- On this qualified host, one authorized setup followed by shortcut/browser operation; no routine learner PowerShell or external SSH.
- Actual Agent remains non-Administrator without Hyper-V/protected write access; Operator remains separately authorized. TLS/pairing and fixed-target PTY retain their existing guarantees.
- Package smoke checks cover install/repair/upgrade/uninstall ownership, completed-state retention, active/unknown-work refusal and no unintended VM changes. Unit/content/build/browser regressions remain required; generated fixture outputs stay authored and isolated.
- The old four untracked audits, VM identities, checkpoint count and cold-backup hashes remain intact. No live acceptance run is inferred from harness results.

This is the next implementation plan, not a claim that M4 has shipped. Do not modify the running qualified installation while packaging source changes are being prepared.
