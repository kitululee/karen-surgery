# Deployment Runbook — Karen Surgery Linux VM

This website builds into a **pure static production bundle (`out/`)** using Next.js Static Export (`output: 'export'`). No database, no paid hosting platform, and no production Node.js process is required on the server.

---

## 1. Architecture Choice: Why Native Nginx Static Hosting (No Docker / No Node Runtime)

- **Zero runtime overhead:** Serving pre-rendered HTML, CSS, JS, self-hosted WOFF2 fonts, and pre-optimized AVIF/WebP/JPEG images directly through Nginx uses negligible RAM/CPU and yields sub-20ms TTFB even on a minimal 1 vCPU / 1 GB RAM Linux VM.
- **Minimal attack surface:** No public Node.js server, no database, no admin panel, and no container daemon overhead.
- **Instant zero-downtime releases & rollbacks:** Atomic symlink switching (`/var/www/karen-surgery/current -> releases/<timestamp>`) enables instant 1-command rollbacks with zero downtime.
- **Built-in process management:** Nginx is natively managed by `systemd` (`systemctl enable --now nginx`).

*(If Docker were strictly required by a broader multi-service infrastructure later, a simple `nginx:alpine` image mounting `out/` and `deploy/nginx-karen-surgery.conf` can wrap the exact same artifacts without changing a single line of application code.)*

---

## 2. Server Requirements

- **OS:** Ubuntu 22.04 / 24.04 LTS or Debian 12+ (any modern Linux distribution with Nginx)
- **Resources:** 1 vCPU, 512 MB–1 GB RAM, 5 GB disk (built site `out/` is < 6 MB)
- **Packages:** `nginx`, `certbot`, `python3-certbot-nginx`, `ufw`, `rsync`
- **Local build machine:** Node.js 20+ (builds `out/` cleanly before `rsync`ing to the VM — the VM itself does not even need Node.js installed!)

---

## 3. Initial One-Time VM Setup (Run on Linux VM)

> **Important:** Before making changes on an existing VM, always inspect running services (`sudo ss -tulpn`), existing Nginx sites (`ls -la /etc/nginx/sites-enabled/`), and disk space (`df -h`) to avoid port conflicts or overwriting existing services.

### 3.1 Install Nginx, Certbot & Firewall Tools
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx ufw rsync
```

### 3.2 Configure Firewall (UFW)
Ensure SSH stays open **before** enabling UFW:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # Opens ports 80 (HTTP) and 443 (HTTPS)
sudo ufw enable
sudo ufw status
```

### 3.3 Prepare Web Root Directories
```bash
sudo mkdir -p /var/www/karen-surgery/releases /var/www/certbot
sudo chown -R "$USER":"$USER" /var/www/karen-surgery
```

### 3.4 Install Nginx Configuration
Copy `deploy/nginx-karen-surgery.conf` to `/etc/nginx/sites-available/karen-surgery`:
```bash
sudo cp /path/to/nginx-karen-surgery.conf /etc/nginx/sites-available/karen-surgery
sudo ln -sf /etc/nginx/sites-available/karen-surgery /etc/nginx/sites-enabled/karen-surgery
# Only remove the default site if no other service uses it:
# sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

---

## 4. DNS & HTTPS (Let's Encrypt) Setup

### 4.1 DNS Records
Point your domain DNS records to the Linux VM's public IP address:
- `A` record: `@` (`karensurgery.com`) → `<VM_PUBLIC_IP>`
- `A` record: `www` (`www.karensurgery.com`) → `<VM_PUBLIC_IP>`
- *(Optional `AAAA` records if IPv6 is enabled on the VM)*

Wait for DNS propagation (`dig +short www.karensurgery.com`).

### 4.2 Provision Free TLS Certificate (Certbot)
```bash
sudo certbot --nginx -d karensurgery.com -d www.karensurgery.com --redirect
```
Verify automatic renewal timer:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### 4.3 Enable HSTS (After Confirming HTTPS Works)
Uncomment the `Strict-Transport-Security` header line inside `/etc/nginx/sites-available/karen-surgery`, then verify and reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Automated Zero-Downtime Deployment & Rollback

> **Security Rule:** Never store or paste your SSH private key inside this repository, scripts, logs, or documentation. Pass its local path via environment variable at deploy time (`chmod 600 ~/.ssh/<key>`).

### Deploy a New Release (from local workstation)
```bash
chmod +x deploy/deploy.sh deploy/rollback.sh

DEPLOY_HOST="<VM_PUBLIC_IP>" \
DEPLOY_USER="<SSH_USERNAME>" \
SSH_KEY="$HOME/.ssh/<YOUR_PRIVATE_KEY>" \
./deploy/deploy.sh
```
What `deploy/deploy.sh` does:
1. Runs `npm run build` locally (optimizing all images and exporting static HTML/CSS/JS to `out/`).
2. Uploads `out/` via `rsync` into `/var/www/karen-surgery/releases/<UTC_TIMESTAMP>/`.
3. Atomically swaps `/var/www/karen-surgery/current` to the new release.
4. Validates Nginx syntax (`nginx -t`) and reloads gracefully (`systemctl reload nginx`).
5. Retains the 5 most recent releases for instant rollback.

### Instant Rollback to Previous Release
```bash
DEPLOY_HOST="<VM_PUBLIC_IP>" \
DEPLOY_USER="<SSH_USERNAME>" \
SSH_KEY="$HOME/.ssh/<YOUR_PRIVATE_KEY>" \
./deploy/rollback.sh
```

---

## 6. Post-Deployment Verification Checklist

```bash
# 1. Verify HTTPS and security headers
curl -I https://www.karensurgery.com/

# 2. Verify all core routes return HTTP 200
for route in "" about/ team/ services/ doctors/ mental-health/ physiotherapy/ \
             allied-health-professionals/ laboratory-services/ opening-hours/ \
             medical-info/ location/ contact-us/ sitemap.xml robots.txt; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://www.karensurgery.com/$route")
  echo "$code /$route"
done

# 3. Verify legacy redirect returns 301
curl -I https://www.karensurgery.com/medical-info/child-immunization-schedule/

# 4. Verify Nginx service & error logs
sudo systemctl status nginx --no-pager
sudo tail -n 30 /var/log/nginx/error.log
```
