#!/usr/bin/env bash
set -euo pipefail

# Instant atomic rollback to the previous release on the Linux VM
# Usage:
#   DEPLOY_HOST=203.0.113.10 DEPLOY_USER=ubuntu SSH_KEY=~/.ssh/karen_vm_ed25519 ./deploy/rollback.sh

: "${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "${DEPLOY_USER:?Set DEPLOY_USER}"
: "${SSH_KEY:?Set SSH_KEY}"

REMOTE_BASE="${REMOTE_BASE:-/var/www/karen-surgery}"
SSH_OPTS=(-i "${SSH_KEY}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)

ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<EOF
set -euo pipefail
CURRENT_TARGET="\$(readlink -f "${REMOTE_BASE}/current")"
PREV_RELEASE="\$(ls -1dt "${REMOTE_BASE}/releases"/*/ | sed 's:/\$::' | grep -vxF "\${CURRENT_TARGET}" | head -n 1 || true)"

if [[ -z "\${PREV_RELEASE}" ]]; then
  echo "ERROR: No previous release found in ${REMOTE_BASE}/releases" >&2
  exit 1
fi

echo "Rolling back from \${CURRENT_TARGET} -> \${PREV_RELEASE}"
ln -sfn "\${PREV_RELEASE}" "${REMOTE_BASE}/current.next"
mv -Tf "${REMOTE_BASE}/current.next" "${REMOTE_BASE}/current"
sudo nginx -t
sudo systemctl reload nginx
echo "Rollback complete."
EOF
