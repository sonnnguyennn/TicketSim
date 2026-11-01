#!/bin/sh
# Run manually on the disposable original VM before B5 checkpoint, after operator approval.
set -eu
if [ "$(id -u)" -ne 0 ] || [ "$#" -ne 1 ]; then echo 'root and one public-key file required' >&2; exit 2; fi
key_file=$1
if [ ! -f "$key_file" ] || [ "$(wc -l < "$key_file")" -ne 1 ]; then echo 'one SSH public key required' >&2; exit 2; fi
public_key=$(cat "$key_file")
case "$public_key" in ssh-ed25519\ *) ;; *) echo 'ed25519 key required' >&2; exit 2;; esac
if id ticketsim-agent >/dev/null 2>&1; then echo 'ticketsim-agent already exists; inspect manually' >&2; exit 3; fi
if [ ! -x /usr/sbin/nft ] || [ ! -x /usr/sbin/nginx ] || [ ! -x /usr/sbin/sshd ]; then echo 'required tools missing' >&2; exit 3; fi
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g root -m 0755 "$(dirname "$0")/agent-command.sh" /usr/local/libexec/ticketsim-lab-action
useradd --system --create-home --shell /bin/sh ticketsim-agent
passwd -l ticketsim-agent >/dev/null
install -d -o ticketsim-agent -g ticketsim-agent -m 0700 /home/ticketsim-agent/.ssh
printf 'restrict,command="/usr/local/libexec/ticketsim-lab-action" %s\n' "$public_key" > /home/ticketsim-agent/.ssh/authorized_keys
chown ticketsim-agent:ticketsim-agent /home/ticketsim-agent/.ssh/authorized_keys
chmod 0600 /home/ticketsim-agent/.ssh/authorized_keys
cat > /etc/sudoers.d/ticketsim-agent <<'EOF'
Defaults:ticketsim-agent !requiretty
ticketsim-agent ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/sshd -t, /usr/bin/sha256sum /etc/nginx/nginx.conf, /usr/bin/sha256sum /etc/netplan/50-cloud-init.yaml, /usr/bin/sha256sum /etc/cloud/cloud.cfg.d/99-ticketsim-network.cfg, /usr/bin/sha256sum /etc/ssh/sshd_config, /usr/sbin/nft list ruleset, /usr/bin/systemctl stop nginx
EOF
chmod 0440 /etc/sudoers.d/ticketsim-agent
visudo -cf /etc/sudoers.d/ticketsim-agent
echo 'Dedicated forced-command account prepared; validate each operation before B5 baseline.'
