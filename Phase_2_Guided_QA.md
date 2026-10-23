# Phase 2 — Guided batch 30 QA (2026-10-23)

## Coverage

Guided increased from **12 to 42 of 112**; **70 remain**. The 30 new cases are:

| Topic | Cases | Technical reading and decision reviewed |
|---|---|---|
| SSH | VPS-01-004 (L1), 005 (L2), 006 (L2), 007 (L3) | Active sshd is separate from firewall reachability; rebuild history does not authenticate a host key; a Fail2ban ban needs source/identity checks; port 2222 needs effective config, listener and client test. |
| Network | VPS-02-002 (L0), 003 (L1), 004 (L1), 005 (L2), 007 (L3) | IP success does not prove DNS; disconnected profile is distinct from missing allocation; listener 443 does not prove edge reachability; IPv4/IPv6 are separate; source-dependent timeout needs multi-site evidence and escalation. |
| Linux System & Services | VPS-03-002 (L0), 004 (L1), 005 (L2), 006 (L2) | UID/mode and ACL; SELinux AVC vs global disable; dependency failure vs database root cause; service restart loop vs Python venv. |
| CPU/RAM & Performance | VPS-04-001 (L0), 002 (L0), 003 (L1), 004 (L1), 005 (L2) | CPU snapshot needs process owner; active swap vs CPU; OOM event vs memory limit; I/O wait plus device latency; cgroup throttling vs host CPU. |
| Disk & Filesystem | VPS-05-003 (L1), 005 (L2), 006 (L2), 007 (L3) | Journal retention and free blocks; disk/partition/filesystem layers; deleted open file; EXT4/fsck integrity incident needs offline recovery and escalation. |
| Web Server & HTTP | VPS-07-002 (L0), 004 (L1), 006 (L2), 007 (L3) | 403 index/access; 502 upstream while Nginx active; 503 after deploy plus app auto-restart; SNI/vhost/cert mapping with DNS and inventory checks. |
| DNS & Domain | VPS-08-001 (L0), 004 (L1), 005 (L2), 007 (L3) | A record vs assigned IP; guest resolver timeout vs IP HTTP; authoritative vs recursive cache/TTL; PTR vs forward A and provider IP ownership. |

Each case has a customer symptom, two unchanged original P1/P2 outputs, case-specific explanations, five scored choices (recognition, command, output, evidence select, decision), and a self-reviewed short ticket note. L2/L3 cases add one or two authored probe outputs that are required before interpretation plus an ordered investigation/decision/verification question. The new 20 Command Library cards explain distinct techniques and panel tasks, taking the library from 76 to **96** cards. No batch case was made Stateful or Objective Exam solely to raise the count.

The source ticket fixture for VPS-08-006 mixes a panel allocation note into a `dig` output; VPS-07-003 embeds an “intended deploy” annotation inside `nginx -T` output. Both were excluded from this batch pending fixture correction so a learner is not taught that those tools produce panel/business context. P1/P2 for all 112 tickets remain unchanged. New output is explicitly authored in `scripts/guided-content.mjs` and generated through `npm run prepare-data`.

## Acceptance checks

| Gate | Result |
|---|---|
| Schema and duplicate command/alias validation | Passed in `npm run prepare-data`: 112 original, 42 Guided |
| Every Guided P1/P2 equals original fixture; every command links a library card | Passed in `src/guided/engine.test.ts` |
| All public questions have separated keys and answer-specific feedback; correct and incorrect grading checked | Passed in `src/guided/engine.test.ts` |
| Exact fixture/alias/state matching and no fabricated unmatched output | Passed in existing command/state tests |
| L2/L3 required extra probes and ordered answer is not preselected correctly | Passed in `src/guided/engine.test.ts` |
| New L3 browser path hides output initially and blocks interpretation until G1/G2 | Passed in Playwright |
| `npm test -- --run` | 18/18 passed |
| `npm run build` | Passed; Vite reports a bundle size advisory above 500 kB |
| `npm run test:browser` | 6/6 passed at Chromium 1208 |

Content checks are an authored review of fixture meaning and safety boundaries, not proof of behavior on a live VPS. Original fixture brevity, fixed outputs and the browser-only learning barrier remain limitations. The 30 new cases do not yet have independent review variants for Mastered.
