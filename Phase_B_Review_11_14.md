# Phase B — Technical/editorial review, topics 11–14

## B1 samples inspected and revised

| Ticket | Topic | Level | Status | Specific technical/editorial finding |
|---|---|---|---|---|
| VPS-11-001 | Backup | L0 | Reviewed and revised | Target quota is not guest disk space; failed task is not a verified backup. All question/option feedback now names the relevant task/log/retention decision. |
| VPS-12-004 | Panel | L1 | Reviewed and revised | nproc counts CPUs available to the calling process; affinity/offline CPUs and current/max host allocation must be distinguished. No key change. |
| VPS-13-006 | Docker | L2 | Reviewed and revised | Container default route does not prove forwarding or NAT; host change requires policy and approval. |
| VPS-14-008 | Billing | L3 | Reviewed and revised | Removed premature abuse reason from triage; appeal received is not approved; security-lead owns override. |

B1 count: 4 cases technically/editorially inspected and revised, not merely schema validated. Other 28 cases are pending B2 authoring. Source JSON and authored answer IDs/keys remain unchanged.

## References consulted

- Docker bridge/firewall: https://docs.docker.com/engine/network/packet-filtering-firewalls/ and https://docs.docker.com/engine/network/drivers/bridge/
- libvirt current vs maximum vCPU: https://libvirt.org/formatdomain.html
- GNU nproc: https://www.gnu.org/s/coreutils/manual/html_node/nproc-invocation.html (official GNU search result verified the available-to-current-process wording; full initial fetch timed out).
- Docker ps/Compose ps stopped containers: https://docs.docker.com/reference/cli/docker/container/ls/ and https://docs.docker.com/reference/cli/docker/compose/ps/
- Port publication vs EXPOSE: https://docs.docker.com/engine/network/port-publishing/
- GNU tar data integrity: https://www.gnu.org/software/tar/manual/html_node/Data-corruption-and-repair.html

Panel, billing, backup task outputs are fictional application records supplied by TicketSim. They are reviewed for internal consistency, dates, authority and limits; they are not claims about the policy or CLI of a real provider.
