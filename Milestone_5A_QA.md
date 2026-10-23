# Milestone 5A — acceptance and content audit

## Pilot coverage

| Ticket | Initial evidence | Allowed simulation | Post-action observation | Honest disposition |
|---|---|---|---|---|
| `VPS-01-001` | `sshd` inactive, no TCP/22 listener | Start service after P1/P2/log and approval | `sshd` active and :22 listening; client still gets `Permission denied` | Transport improved; login not verified |
| `VPS-03-001` | Nginx inactive, no :80 listener | Start after log/config checks and approval | Service/listener active; local HTTP 502 | Upstream still needs investigation |
| `VPS-05-001` | Root block space 100%, `/var/log` large | Approved archived journal vacuum | About 1G free in authored fixture; journal smaller | App write and ongoing log growth not yet verified |
| `VPS-02-001` | Guest has IP, no default route | Restore route using panel-assigned gateway with console/approval | Route exists, kernel selects gateway; ICMP still fails | Check upstream/TCP; do not call resolved |
| `VPS-08-003` | Client sees old NS; panel zone edited at new NS | Registrar delegation change with owner approval | Registrar shows new NS, recursive resolver still old cache | Track TTL and authoritative/client answers |
| `VPS-05-004` | `/data` read-only; kernel reports I/O error | Open storage incident and protect data | Incident assigned; `/data` still read-only | Escalated, not fixed |

All six have an explicitly blocked unsafe action and required post-action probes. `P1/P2` source outputs in `starter-data/tickets.json` are unchanged. The simulator changes only a local draft state; no guest, panel, hypervisor, shell, SSH or VirtualBox operation is executed.

## Verification

- First SSH engine pilot passed before authoring the other five cases. Automated tests now exercise six action gates, blocked actions, exact state-specific outputs and post-action verification; six-question Objective Exam grading; v4→v5 migration; localStorage round trip; legacy data and 112 source fixtures.
- Browser smoke test used a separate `127.0.0.1:5175` origin. SSH initial screen hid actions until P1/P2; attempting start before log returned **thiếu bằng chứng** and appeared in Review Mistakes; a permitted start loaded different post-state output; `Permission denied` remained visible; final note and Completed state survived page refresh. Objective Exam submission with two wrong choices showed **4/6** and explanations. The user's `localhost:5174` progress was not changed.
- Desktop layout was inspected visually. Responsive CSS stacks the workspace/sidebar and action cards below 760px; a mobile viewport browser run remains a separate QA task.
- Run `npm test -- --run` and `npm run build` after changing content. The preparation script validates authored states/probes and generates separate public question/feedback files.

## Limits

Fixtures model one authored branch per allowed action, plus blocked alternatives. A service can start and still fail user-facing verification. Journal cleanup, route reachability, DNS caching and storage recovery are simplified snapshots, not predictions of a real VPS. There is no graded free-text note, real time telemetry, multi-step rollback, alternate scenario review set or Mastered award. These belong in Milestone 5B together with mobile/keyboard browser QA and domain expert review before expanding Guided beyond 12 cases.
