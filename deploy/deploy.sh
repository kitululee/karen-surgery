#!/usr/bin/env bash
set -euo pipefail

# Zero-downtime atomic release script for Karen Surgery static site -> Linux VM
# Usage:
#   DEPLOY_HOST=203.0.113.10 DEPLOY_USER=ubuntu SSH_KEY=~/.ssh/karen_vm_ed25519 ./deploy/deploy.sh
#
# Never commit SSH private keys or server credentials into this repository.

: "${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. VM public IP or hostname)}"
: "${DEPLOY_USER:?Set DEPLOY_USER (e.g. ubuntu or deploy)}"
: "${SSH_KEY:?Set SSH_KEY (path to SSH private key file)}"

REMOTE_BASE="${REMOTE_BASE:-/var/www/karen-surgery}"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
REMOTE_RELEASE="${REMOTE_BASE}/releases/${RELEASE_ID}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Building production static export locally..."
cd "${PROJECT_DIR}"
npm run build

if [[ ! -f "${PROJECT_DIR}/out/index.html" ]]; then
  echo "ERROR: Build output out/index.html missing." >&2
  exit 1
fi

SSH_OPTS=(-i "${SSH_KEY}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)

echo "==> Preparing release directory ${REMOTE_RELEASE} on ${DEPLOY_HOST}..."
ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "sudo mkdir -p '${REMOTE_BASE}/releases' && sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} '${REMOTE_BASE}' && mkdir -p '${REMOTE_RELEASE}'"

echo "==> Syncing built site via rsync..."
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  "${PROJECT_DIR}/out/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_RELEASE}/"

echo "==> Atomically activating release ${RELEASE_ID} and reloading Nginx..."
ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<EOF
set -euo pipefail
ln -sfn "${REMOTE_RELEASE}" "${REMOTE_BASE}/current.next"
mv -Tf "${REMOTE_BASE}/current.next" "${REMOTE_BASE}/current"
sudo nginx -t
sudo systemctl reload nginx
# Prune old releases beyond KEEP_RELEASES
cd "${REMOTE_BASE}/releases"
ls -1dt */ | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf --
EOF

echo "==> Deployment complete! Active release: ${RELEASE_ID}"
