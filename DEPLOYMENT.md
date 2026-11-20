# Deployment Runbook — Karen Surgery (Public Site, Backend API & Admin Portal)

Karen Surgery Phase 2 comprises three cleanly separated deployables that run smoothly on a single Linux VM (Nginx + Node.js 22 + PostgreSQL/SQLite), while also supporting static GitHub Pages previews for the public frontend:

1. **Public Website (`/` -> `out/`):** Next.js 15 Static Export served by Nginx at `https://www.karensurgery.com` (and previewable on GitHub Pages).
2. **Backend API (`server/` -> `server/dist/`):** Fastify 5 Node.js API bound to `127.0.0.1:4000`, proxied by Nginx at `https://api.karensurgery.com`.
3. **Independent Administration Portal (`admin/` -> `admin/dist/`):** React + Vite SPA served by Nginx at `https://admin.karensurgery.com` (never linked in public navigation, `noindex`).

---

## 1. Server Requirements (Linux VM)

- **OS:** Ubuntu 22.04 / 24.04 LTS or Debian 12+
- **Resources:** 1–2 vCPU, 1–2 GB RAM, 10+ GB SSD
- **Packages:** `nginx`, `certbot`, `python3-certbot-nginx`, `ufw`, `rsync`, `nodejs` (v22 LTS), and `postgresql` (recommended) or `sqlite3` (for zero-daemon SQLite deployments)

---

## 2. DNS Records

Point all required hostnames to the Linux VM's public IP address:
- `A` record: `@` (`karensurgery.com`) -> `<VM_PUBLIC_IP>`
- `A` record: `www` (`www.karensurgery.com`) -> `<VM_PUBLIC_IP>`
- `A` record: `api` (`api.karensurgery.com`) -> `<VM_PUBLIC_IP>`
- `A` record: `admin` (`admin.karensurgery.com`) -> `<VM_PUBLIC_IP>`

---

## 3. Initial One-Time Linux VM Setup

> Inspect running services (`sudo ss -tulpn`), existing Nginx sites (`ls -la /etc/nginx/sites-enabled/`), and disk space (`df -h`) before modifying an existing VM.

### 3.1 Install Base Packages & Firewall
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx ufw rsync postgresql sqlite3

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3.2 Create Directories & Secrets File
```bash
sudo mkdir -p \
  /var/www/karen-surgery/releases \
  /var/www/karen-surgery-admin/releases \
  /var/www/karen-surgery-api/current \
  /var/www/karen-surgery-api/uploads \
  /var/lib/karen-surgery \
  /var/backups/karen-surgery \
  /var/www/certbot \
  /etc/karen-surgery

sudo chown -R www-data:www-data /var/lib/karen-surgery /var/www/karen-surgery-api/uploads
```

Create `/etc/karen-surgery/api.env` from `server/.env.example` (set strict `600` permissions):
```bash
sudo cp server/.env.example /etc/karen-surgery/api.env
sudo chmod 600 /etc/karen-surgery/api.env
sudo chown root:www-data /etc/karen-surgery/api.env
```

Required production values inside `/etc/karen-surgery/api.env`:
- `NODE_ENV=production`
- `HOST=127.0.0.1`, `PORT=4000`
- `COOKIE_SECRET=<64-char random hex via openssl rand -hex 32>`
- `COOKIE_SECURE=true`
- `CORS_ORIGINS=https://www.karensurgery.com,https://karensurgery.com,https://admin.karensurgery.com`
- `DATABASE_URL=postgres://karen_surgery:<password>@127.0.0.1:5432/karen_surgery` *(or omit `DATABASE_URL` and set `SQLITE_PATH=/var/lib/karen-surgery/karen-surgery.sqlite`)*
- `UPLOAD_DIR=/var/www/karen-surgery-api/uploads`
- `PUBLIC_API_URL=https://api.karensurgery.com`
- `ADMIN_PORTAL_URL=https://admin.karensurgery.com`
- `RECEPTION_EMAIL=Receptionist@KarenSurgery.com`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` *(add when practice SMTP credentials are provided)*

---

## 4. Deploy Backend API & Provision Initial Super Admin

```bash
# Build server bundle (on build machine or VM)
cd server && npm ci && npm run build

# Sync dist/, migrations/, package.json, package-lock.json to /var/www/karen-surgery-api/current
# Install production dependencies on VM:
cd /var/www/karen-surgery-api/current && npm ci --omit=dev

# Run idempotent schema migrations and seed verified Karen Surgery data
set -a && source /etc/karen-surgery/api.env && set +a
node dist/db/migrate.js
node dist/db/seed.js

# Provision the initial SUPER_ADMIN account securely (prompts interactively, or reads ADMIN_EMAIL/ADMIN_NAME/ADMIN_PASSWORD)
node dist/cli/create-admin.js
```

Install and start the hardened systemd service (`deploy/karen-surgery-api.service`):
```bash
sudo cp deploy/karen-surgery-api.service /etc/systemd/system/karen-surgery-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now karen-surgery-api
sudo systemctl status karen-surgery-api --no-pager
```

---

## 5. Build & Deploy Public Website & Admin Portal

### 5.1 Public Website (`https://www.karensurgery.com`)
```bash
NEXT_PUBLIC_API_URL="https://api.karensurgery.com" npm run build
# Deploy out/ atomically using deploy/deploy.sh (or rsync to /var/www/karen-surgery/releases/<stamp> and update current symlink)
```

### 5.2 Independent Admin Portal (`https://admin.karensurgery.com`)
```bash
cd admin
VITE_API_URL="https://api.karensurgery.com" \
VITE_PUBLIC_SITE_URL="https://www.karensurgery.com" \
npm run build
# Upload admin/dist/ to /var/www/karen-surgery-admin/releases/<stamp> and symlink /var/www/karen-surgery-admin/current
```

### 5.3 Install Nginx Configs & Provision Let's Encrypt TLS
```bash
sudo cp deploy/nginx-karen-surgery.conf /etc/nginx/sites-available/karen-surgery
sudo cp deploy/nginx-api-and-admin.conf /etc/nginx/sites-available/karen-surgery-phase2
sudo ln -sf /etc/nginx/sites-available/karen-surgery /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/karen-surgery-phase2 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx \
  -d karensurgery.com \
  -d www.karensurgery.com \
  -d api.karensurgery.com \
  -d admin.karensurgery.com \
  --redirect
```

---

## 6. Automated Backups (Database + Uploaded Media)

Install `deploy/backup-db.sh` and schedule via root cron:
```bash
sudo cp deploy/backup-db.sh /usr/local/bin/karen-surgery-backup.sh
sudo chmod 750 /usr/local/bin/karen-surgery-backup.sh
# Add daily 02:15 cron entry:
# 15 2 * * * /usr/local/bin/karen-surgery-backup.sh >> /var/log/karen-surgery-backup.log 2>&1
```

---

## 7. GitHub Pages Public Preview Hosting

`.github/workflows/deploy-pages.yml` automatically deploys the public static bundle to `https://kitululee.github.io/karen-surgery/` on every push to `main`:
- By default (`vars.NEXT_PUBLIC_API_URL` unset), the public site operates smoothly in **static preview mode**: Leaflet OpenStreetMap works live, the grounded Practice Assistant answers verified practice questions with full safety guardrails, and appointment/enquiry forms prepare instant Email & WhatsApp messages for reception.
- Once your Linux VM API is live at `https://api.karensurgery.com`, you can optionally connect GitHub Pages directly to the live backend by adding the repository variable `NEXT_PUBLIC_API_URL` in GitHub Settings -> Actions -> Variables (and adding `https://kitululee.github.io` to `CORS_ORIGINS` on the VM).

---

## 8. Post-Deployment Verification Checklist

```bash
curl -s https://api.karensurgery.com/api/public/health
curl -I https://www.karensurgery.com/
curl -I https://admin.karensurgery.com/   # Must include X-Robots-Tag: noindex
sudo systemctl status karen-surgery-api nginx --no-pager
```
