#!/bin/sh
# Read-only operator probe on the future Ubuntu guest; never called by the SPA/agent.
set -eu
. /etc/os-release
test "$ID" = ubuntu && test "$VERSION_ID" = 22.04
dpkg-query -W -f='${Package} ${Version}\n' nginx openssh-server
systemctl is-active ssh
systemctl is-active nginx
sha256sum /var/www/html/index.html
curl --fail --max-time 5 --silent http://127.0.0.1/
