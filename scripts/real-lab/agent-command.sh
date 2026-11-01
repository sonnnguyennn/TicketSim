#!/bin/sh
# Forced-command dispatcher for the dedicated ticketsim-agent SSH key.
set -eu
case "${SSH_ORIGINAL_COMMAND-}" in
  real-web-identity-v1) hostname; ip -4 -o addr show dev eth1 ;;
  real-web-nginx-config-v1) sudo -n /usr/sbin/nginx -t ;;
  real-web-ssh-config-v1) sudo -n /usr/sbin/sshd -t ;;
  real-web-nginx-status-v1) systemctl is-active nginx ;;
  real-web-page-hash-v1) sha256sum /var/www/html/index.html ;;
  real-web-nginx-hash-v1) sudo -n /usr/bin/sha256sum /etc/nginx/nginx.conf ;;
  real-web-netplan-hash-v1) sudo -n /usr/bin/sha256sum /etc/netplan/50-cloud-init.yaml ;;
  real-web-cloudinit-hash-v1) sudo -n /usr/bin/sha256sum /etc/cloud/cloud.cfg.d/99-ticketsim-network.cfg ;;
  real-web-ssh-hash-v1) sudo -n /usr/bin/sha256sum /etc/ssh/sshd_config ;;
  real-web-firewall-v1) sudo -n /usr/sbin/nft list ruleset ;;
  real-web-route-v1) ip -4 route get 10.77.77.1 ;;
  real-web-stop-nginx-v1) sudo -n /usr/bin/systemctl stop nginx ;;
  *) printf '%s\n' 'DENIED' >&2; exit 126 ;;
esac
