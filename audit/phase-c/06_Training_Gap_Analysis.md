# Training fit for VPS Hosting Support

## What the current material can teach

The 112 semantically reviewed cases cover 14 topics with eight cases per topic and L0–L3 labels. `10_Competency_Matrix.csv` links every ticket to nine VPS Support competencies. Its tags describe authored opportunities to practice, not demonstrated learner skill. A learner can rehearse symptom recognition, choosing a listed check, reading a fixture, distinguishing an observation from an unsupported root cause, and naming verification/escalation. This is useful preparation for supervised L1 triage. It does not establish unscripted command choice, live output interpretation, customer communication, production authorization, or independent incident handling. The 620 semantically reviewed graded questions test choices inside known scenarios; 112 final notes are self-reviewed. Every ticket has a symptom, command and output question; escalation and customer communication are often guidance or self-review rather than independently scored performance. Objective Exam/independent review covers only 20 cases and Stateful behavior 6.

## Fit to public GreenCloud scope

GreenCloud publicly offers Linux KVM and Windows VPS and describes 24/7 support. Its current [ToS §4](https://greencloudvps.com/terms-of-service.php) limits unmanaged support to server hardware functionality and default-installation software support. The [ticket form](https://www.greencloudvps.com/billing/submitticket.php?language=english) says additional assistance beyond hardware/network may be charged. The exact line between advice and hands-on guest repair needs the purchased product terms and internal SOP. For L1 training, teach a decision sequence: identify product and customer authority; separate client, guest, panel and provider node; collect read-only evidence; guide the customer for guest-managed software; escalate provider-side faults and authorized changes.

## Priority gaps with rationale

| Gap | Why it matters | Current evidence / next curriculum step |
|---|---|---|
| Windows VPS/RDP | Public product line includes Windows VPS; Linux commands do not transfer. | No Windows topic among 14. Add RDP path, guest firewall, console and licensing/support boundary as separate cases. |
| Provider-side IPv6/network | Network cases include some IPv6, yet triage across guest route, provider ACL, null-route and external path requires role-specific evidence. | Add a mixed-source case with client trace, guest route and NOC escalation; avoid claiming one hop proves fault location. |
| Abuse/security response | The ToS permits suspension/null-routing for abuse and places account responsibilities on customers. | Eight Security & Abuse cases exist, but staff authorization, evidence preservation and customer notice need SOP-backed branches. |
| Panel/lifecycle authority | Boot, rescue and reinstall have different blast radius; public SolusVM KB explicitly warns reinstall erases data. | Existing VPS Management/Control Panel/Virtualization cases cover concepts; add explicit customer identity and approval decisions. |
| Backup and restore | A backup listing or successful task does not prove restorability or application consistency. | Eight Backup cases exist; add restore-drill evidence and RPO/RTO communication only with an approved lab and product context. |
| Customer reply and internal note | Real support work needs clear updates, evidence, owner and next action. | The final note is self-reviewed; add rubric-based review with human feedback and short customer-facing drafts. |
| Mixed and unknown incidents | Fixed case prompts and choices can cue the cause. | Add a small number of blind cases where several checks are valid and “insufficient evidence” is correct. |

## Lower priority for an intern

Deep `virsh` host operations, storage consistency repair, DNSSEC key rollover and Docker image repair are valuable concepts for **recognition and escalation**, but detailed execution should be advanced/NOC or owner training unless role and product demand it. Current cases such as `VPS-10-001`, `VPS-08-008` and `VPS-13-001` should emphasize evidence and handoff over unsupervised remediation. This is a prioritization recommendation, not proof those subjects never arise.

No public source gives GreenCloud ticket frequencies, internal access levels, or customer-specific managed-service commitments. The gap ranking is based on public product scope and general VPS support practice, not a claim about GreenCloud's production incident distribution.
