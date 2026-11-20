# Karen Surgery — Website, Patient Engagement & Administration Platform

Complete production platform for **Karen Surgery** (*Family Medical Practice, Est. 1991 — 333 Ngong Road, Karen, Nairobi, Kenya*).

Built in two coordinated phases while strictly preserving the approved Phase 1 visual identity and 100% authentic content from `karensurgery.com`:

- **Public Website (`src/`):** Next.js 15 (App Router, Static Export), TypeScript, Tailwind CSS v4, self-hosted WOFF2 fonts, `sharp` AVIF/WebP/JPEG pipeline, Leaflet + OpenStreetMap interactive building map, Appointment Request modal, General Inquiry form, and grounded Practice Assistant chatbot.
- **Backend API (`server/`):** Fastify 5, TypeScript, Zod validation, Argon2id + HttpOnly session + CSRF authentication, 4-role RBAC, dual PostgreSQL/SQLite persistence (17 tables), Nodemailer minimal-privacy email routing, and retrieval-based chatbot engine.
- **Independent Administration Portal (`admin/`):** React + Vite + TypeScript + Tailwind v4 SPA (`admin.karensurgery.com`) for managing appointments, enquiries (contact form + chatbot), CMS pages/sections, practitioners, services, media uploads, chatbot knowledge, website/emergency settings, users, and audit logs.

---

## Project Documentation

### Phase 1 — Discovery, Design System & Content Integrity
| Document | Purpose |
| :--- | :--- |
| [DISCOVERY_REPORT.md](./DISCOVERY_REPORT.md) | Audit of `karensurgery.com`, design inspiration analysis, patient journeys, and technical findings |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Approved color palette, typography scale, editorial components, accessibility, and performance architecture |
| [IMAGE_ASSET_MAP.md](./IMAGE_ASSET_MAP.md) | Mapping of all 24 authentic practice & clinician photographs to optimized local assets |
| [CONTENT_REVIEW.md](./CONTENT_REVIEW.md) | Human approval checklist for verified source content |
| [QA_REPORT.md](./QA_REPORT.md) | Phase 1 automated, live-browser, and Lighthouse QA report |

### Phase 2 — Functional Enhancements, Backend API & Administration System
| Document | Purpose |
| :--- | :--- |
| [PHASE2_IMPLEMENTATION_REPORT.md](./PHASE2_IMPLEMENTATION_REPORT.md) | Complete Phase 2 implementation status, UI preservation audit, QA results, and deployment readiness |
| [ADMIN_PORTAL_GUIDE.md](./ADMIN_PORTAL_GUIDE.md) | Admin Portal provisioning, RBAC roles, and operational workflow guide |
| [APPOINTMENT_SYSTEM.md](./APPOINTMENT_SYSTEM.md) | Request-and-follow-up appointment workflow, dynamic options, validation, and routing |
| [CHATBOT_CONFIGURATION.md](./CHATBOT_CONFIGURATION.md) | Grounded FAQ retrieval, emergency/clinical guardrails, and reviewable enquiry draft workflow |
| [EMAIL_CONFIGURATION.md](./EMAIL_CONFIGURATION.md) | Privacy-minimised email routing rules and production SMTP setup guide |
| [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) | Healthcare privacy controls, authentication/CSRF/RBAC, upload security, and VM hardening |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete REST API reference for public, auth, and administrative endpoints |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Relational schema across all 17 tables (PostgreSQL & SQLite parity) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Full-stack Linux VM deployment (Nginx, systemd, Certbot TLS, backups) & GitHub Pages workflow |

---

## Local Development Quick Start

### 1. Public Website (`http://localhost:3000`)
```bash
npm install
npm run dev                  # Local dev server
npm run build && npm run qa  # Build static export (out/) + run 18-point QA audit
```
*(Set `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000` to connect the public website to your local backend API.)*

### 2. Backend API (`http://127.0.0.1:4000`)
```bash
cd server
npm install
npm run migrate && npm run seed
npm run create-admin         # Interactive prompt (or set ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD)
npm run dev                  # Or: npm run build && npm test
```

### 3. Independent Administration Portal (`http://localhost:5173`)
```bash
cd admin
npm install
npm run dev                  # Connects to http://127.0.0.1:4000 by default
npm run typecheck && npm run build
```

---

## Public Website Routes

All 10 original URLs from `karensurgery.com` are preserved directly alongside 3 unifying index routes (`/` · `/about/` · `/team/` · `/services/` · `/doctors/` · `/mental-health/` · `/physiotherapy/` · `/allied-health-professionals/` · `/laboratory-services/` · `/opening-hours/` · `/medical-info/` · `/location/` · `/contact-us/`). The Administration Portal is hosted independently and never linked in public navigation.
