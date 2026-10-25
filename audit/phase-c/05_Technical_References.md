# Verified references

Accessed 2026-10-26. Links below were opened during this audit. A source verifies only the stated scope, not every fictional TicketSim output.

| Source | Verified scope | Limit |
|---|---|---|
| [GreenCloud Terms of Service](https://greencloudvps.com/terms-of-service.php) | §4 states unmanaged hardware-functionality support and limited default-installation software support; §6 assigns backup responsibility to customer; §7 covers abuse; §3 covers migration/plan rules. | Public terms can change; exact internal SOP and account-specific contract unknown. |
| [GreenCloud submit ticket](https://www.greencloudvps.com/billing/submitticket.php?language=english) | Technical support is 24/7; warns unmanaged troubleshooting beyond hardware/network may be charged. | Does not define staff permissions or a guaranteed action workflow. |
| [GreenCloud home](https://greencloudvps.com/) | Current public Windows VPS, KVM VPS, SolusVM/VirtFusion and 24/7 support claims. | Product marketing is not a production topology map. |
| [GreenCloud SolusVM management KB](https://greencloudvps.com/billing/knowledgebase/25/How-to-manage-your-KVM-and-OpenVZ-VPS-in-SolusVM.html) | Customer panel offers reboot/shutdown/boot/reinstall and VNC; reinstall wipes data. | Article mentions OpenVZ and may describe an older panel; confirm current product/UI. |
| [GreenCloud rescue mode KB](https://greencloudvps.com/billing/knowledgebase/28/How-to-use-the-Rescue-Mode-in-SolusVM-Control-Panel.html?language=english) | Rescue mode may reboot an online VM and disabling it reboots to primary OS. | Panel/version/product applicability is unconfirmed. |
| [Linux `ss(8)`](https://man7.org/linux/man-pages/man8/ss.8.html) | `-l`, `-t`, `-n`, `-p` and output identity for socket inspection; supports `PC-001`. | Example process visibility depends on privilege and version. |
| [OpenSSH `ssh(1)`](https://man.openbsd.org/ssh.1) | `-v` adds debugging; `-o` passes a config option. Supports `PC-002/003`. | The option itself is detailed in `ssh_config(5)`; no lab output was recorded. |
| [OpenSSH `ssh_config(5)`](https://man.openbsd.org/ssh_config.5) | `BatchMode=yes` disables interactive password and host-key prompts, distinct from `-vvv` debug. | No lab output was recorded. |
| [systemd `systemctl`](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html) | Reads and controls unit state. | Online page is systemd 262; exact guest distribution version may differ. |
| [BIND `dig(1)` Debian manpage](https://manpages.debian.org/unstable/dnsutils/dig.1.en.html) | Query syntax and interpretation of response sections for `PC-008`. | Page tracks Debian unstable, not a pinned CentOS package. |
| [Docker `container ls`](https://docs.docker.com/reference/cli/docker/container/ls/) | `-a` includes stopped containers; relevant to `VPS-13-001`. | Docker version and permission model need host context. |
| [systemd `journalctl(1)`](https://www.man7.org/linux/man-pages/man1/journalctl.1.html) | Time-only dates use the current day; `today` and `yesterday` are relative. Supports `PC-011`–`PC-013`. | The rule is source-verified, but no generated TicketSim output was run in a lab. |
| [Linux `ping(8)`](https://man7.org/linux/man-pages/man8/ping.8.html) | `-c` limits echo requests and ping reports round-trip and packet-loss statistics. Supports the alternative answer in `PC-016`. | ICMP loss does not by itself establish TCP service quality or hop location. |
| [Docker Compose `ps`](https://docs.docker.com/reference/cli/docker/compose/ps/) | `docker compose ps --all` includes stopped containers; default output shows running containers. Supports the command-card interpretation. | Does not validate TicketSim's fictional container state. |

The prompt's `cdn.greencloudvps.com/terms-of-service.php` returned HTTP 502 to the web reader. The linked current `greencloudvps.com/terms-of-service.php` was used instead. Old KB links to Ubuntu 14.04 and CentOS 6/7 were not adopted as current OS instructions.

Verification labels in the register: `SOURCE_VERIFIED` means the stated technical point was checked against a linked primary source; `REASONED_ONLY` means direct content review without external confirmation. There are no `LAB_VERIFIED` findings. Guest access policy, staff authorization, panel audit semantics and billing exceptions require `INTERNAL_SOP_REQUIRED` before being stated as GreenCloud procedure.
