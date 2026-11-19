# Karen Surgery — Official Website Redesign

Production-ready website for **Karen Surgery** (*Family Medical Practice, Est. 1991 — 333 Ngong Road, Karen, Nairobi, Kenya*).

Built with **Next.js (App Router, Static Export)**, **TypeScript**, **Tailwind CSS v4**, and a build-time **`sharp` image optimization pipeline** (AVIF + WebP + progressive JPEG) designed for lightweight, secure, zero-subscription hosting on a Linux VM with Nginx.

---

## Project Documentation

| Document | Purpose |
| :--- | :--- |
| [DISCOVERY_REPORT.md](./DISCOVERY_REPORT.md) | Complete audit of `karensurgery.com`, Pinterest design analysis, patient journeys, and technical findings |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Color palette, typography scale, editorial components, accessibility, and performance architecture |
| [IMAGE_ASSET_MAP.md](./IMAGE_ASSET_MAP.md) | Mapping of all 24 original photographs from source URLs to optimized local assets and destination pages |
| [CONTENT_REVIEW.md](./CONTENT_REVIEW.md) | Human approval checklist documenting source discrepancies, outdated items, and copy proposals |
| [QA_REPORT.md](./QA_REPORT.md) | Automated & live-browser QA test results across desktop, mobile, accessibility, SEO, and performance |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Linux VM setup, Nginx security configuration, Let's Encrypt HTTPS, atomic deploy & rollback runbook |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run local development server (http://localhost:3000)
npm run dev

# Optimize all 24 original images + build static production bundle (out/)
npm run build

# Run automated QA audit against out/
npm run qa

# Preview the production static bundle locally
npm start
```

---

## Easy Content & Photo Updates

All practice content is cleanly separated from UI components so updates require editing only plain TypeScript data files:

- `src/data/practice.ts` — Address, coordinates, reception phones, WhatsApp, email, emergency phone, ambulance directories, 1991 history, and 4 care pillars.
- `src/data/team.ts` — All 19 verified clinicians and staff profiles, qualifications, biographies, and direct contacts.
- `src/data/hours.ts` — All 5 distinct opening-hour schedules and night-call policy.
- `src/data/services.ts` — Services overview and partner laboratory details (CTTM & Pathcare Kenya Ltd).
- `src/data/medical-info.ts` — Vaccine notices, reference charts, recommended sites, and medical advisory disclaimer.
- `assets/originals/` — Source photographs. Replace any headshot here and run `npm run build` to automatically regenerate `.avif`, `.webp`, and `.jpg` derivatives and update `src/data/image-manifest.generated.ts`.

---

## Routes Preserved & Added

All 10 original URLs from `karensurgery.com` are preserved directly:
- `/` — Homepage
- `/opening-hours/` — Opening Hours
- `/doctors/` — Doctors, Practice Nurse, Ultrasound Services & Office Assistant
- `/mental-health/` — Mental Health Services & Professionals
- `/physiotherapy/` — Physiotherapy Services & Professionals
- `/allied-health-professionals/` — Allied Health Professionals
- `/laboratory-services/` — Laboratory Services
- `/medical-info/` — Medical Information & Medical Disclaimer
- `/location/` — Where to Find Us (Interactive Map + Schematic Map)
- `/contact-us/` — Contact Us & Emergency / Ambulance Services

Unifying index pages added (strictly using verified source content):
- `/about/` — About the Practice (1991 History & Four Pillars)
- `/team/` — Filterable & Searchable Complete Team Directory (19 personnel)
- `/services/` — Multidisciplinary Services Overview
