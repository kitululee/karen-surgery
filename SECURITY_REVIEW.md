# Karen Surgery — Phase 2 Security & Healthcare Privacy Review

## 1. Threat Model & Clinical Context

Karen Surgery is an independent family medical practice. Although the Phase 2 system is **not** an Electronic Medical Record (EMR) and explicitly instructs patients not to submit detailed medical histories online, appointment requests and general enquiries still contain Personally Identifiable Information (PII) and potential sensitive health-related context. Security controls are therefore designed around **healthcare privacy minimisation, strict server-side authorization, and zero exposed secrets**.

---

## 2. Implemented Security Controls

| Control Area | Implementation Details | Status |
|---|---|---|
| **Password Hashing** | Argon2id (`argon2.argon2id`, memory cost 19 MiB, time cost 2, parallelism 1) via `server/src/middleware/auth.ts` & `server/src/cli/create-admin.ts`. Minimum 12-character password policy enforced via Zod. | Implemented & Tested |
| **Session Management** | 32-byte cryptographically random session tokens (`crypto.randomBytes(32)`), stored **only as SHA-256 hashes** in `admin_sessions`. Delivered in `HttpOnly`, `SameSite=Lax`, `Path=/` cookies (`Secure` enforced in production). **Zero `localStorage` tokens.** | Implemented & Tested |
| **CSRF Protection** | Every session binds a per-session 32-byte `csrf_token`. All state-changing admin endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) verify `X-CSRF-Token` using `crypto.timingSafeEqual`. | Implemented & Tested |
| **Server-Side RBAC** | 4 roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `RECEPTION_OPERATIONS`, `READ_ONLY`) mapped to 14 granular permissions verified on every admin route handler — never purely client-side hidden UI. | Implemented & Tested |
| **Zero Hardcoded Credentials** | No default passwords exist in migrations, seed scripts, frontend, or repository. Initial `SUPER_ADMIN` must be provisioned via `npm run create-admin` CLI on the target host. | Implemented & Verified |
| **Emergency Contact Safeguard** | Updating emergency telephone numbers or banners requires `SUPER_ADMIN` role (`settings.emergency`) **and** an explicit double-confirmation phrase (`"CONFIRM EMERGENCY CHANGE"`), logged to `audit_logs`. | Implemented & Tested |
| **Spam & Abuse Protection** | Per-route Fastify rate limiting (`8/10m` appointments, `10/10m` enquiries, `30/5m` chatbot, `8/15m` admin login, `5/15m` password resets), visually hidden honeypot field (`websiteUrl`), and minimum form completion timing (`startedAt`). | Implemented & Tested |
| **Input Validation & SQL Injection Prevention** | Strict Zod schemas validate every public and admin payload. All database queries use parameterized placeholders (`$1`, `$2`, ...) across both PostgreSQL (`pg`) and SQLite (`node:sqlite`) adapters. | Implemented & Tested |
| **File Upload Validation** | Admin media uploads (`POST /api/admin/media/upload`) validate **file magic bytes** (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`, AVIF `ftypavif/avis`), reject SVGs/scripts/executables, enforce 5 MB max size, and store with random UUID filenames. | Implemented & Tested |
| **In-Use Media Protection** | Deleting media referenced by any practitioner, service, or page section returns `HTTP 409 Conflict` to prevent broken public clinical pages. | Implemented & Tested |
| **Privacy-Minimised Email Notifications** | Email alerts send only the reference number (`KS-APT-...` / `KS-ENQ-...`), service/category, preferred date/contact method, and a deep-link to the protected Admin Portal. Sensitive patient messages and staff `internal_notes` are **never** emailed. | Implemented & Tested |
| **Security Headers & Admin Isolation** | `@fastify/helmet` on API; Nginx configs add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, strict `Content-Security-Policy`, and `X-Robots-Tag: noindex, nofollow, noarchive` on `admin.karensurgery.com` and `api.karensurgery.com`. Admin Portal is never linked from public navigation. | Implemented & Configured |
| **Audit Logging** | Logins, logouts, failed auth/password resets, appointment/enquiry status updates, CMS edits, media uploads/deletions, emergency updates, and user/role changes are recorded with actor, role, IP, timestamp, and entity ID. | Implemented & Tested |
| **Public Draft Leakage Prevention** | Public endpoints explicitly filter `status = 'published'`, `is_published = 1`, `is_active = 1`, `is_approved = 1`, and `is_archived = 0`. Verified via automated integration tests. | Implemented & Tested |

---

## 3. Production Hardening Checklist (For Linux VM Deployment)

1. **TLS / HTTPS Required:** Run Certbot (`certbot --nginx`) on `karensurgery.com`, `www.karensurgery.com`, `api.karensurgery.com`, and `admin.karensurgery.com` before entering real staff credentials or patient data; enable HSTS once HTTPS is verified.
2. **Environment Secrets Isolation:** Place `/etc/karen-surgery/api.env` outside the web root with `chmod 600`, owned by `root:www-data`. Generate a strong 64-character random `COOKIE_SECRET`.
3. **Firewall (`ufw`):** Expose only ports `22` (SSH key-only), `80`, and `443`. Keep Fastify API bound strictly to `127.0.0.1:4000` and PostgreSQL bound to `127.0.0.1:5432`.
4. **Encrypted Backups:** Run `deploy/backup-db.sh` via daily cron and sync encrypted archives off-server. Review `data_retention_days` (default `365` days) periodically with practice leadership under the Kenya Data Protection Act (2019).
5. **SMTP Credentials:** Configure authenticated TLS SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) on the production VM once provided by Karen Surgery.
