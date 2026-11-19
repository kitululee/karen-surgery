# Quality Assurance Report — Karen Surgery Website

**QA Date:** 2026-11-19  
**Build Verified:** Next.js 15.5.29 Static Export (`out/`) served over local HTTP (`http://127.0.0.1:4173/`)  
**Testing Methods:** Automated static HTML/asset/SEO/content audit (`scripts/qa-audit.mjs`), real Chromium live-browser functional & visual QA across Desktop (`1440×900`) and Mobile (`390×844`), and live headless Chrome Lighthouse CLI audits.

---

## 1. Executive Summary

- **Automated Static & Content Integrity Checks (`npm run qa`):** **18 / 18 PASSED**
- **Live Browser Route Audits (13 routes × Desktop & Mobile):** **13 / 13 PASSED** after resolving Round 1 mobile header & drawer defects
- **Live Browser Interactive Feature Checks:** **6 / 6 PASSED**
- **Lighthouse Mobile Audits:** All three tested routes scored **96–100** across Performance, Accessibility, Best Practices, and SEO (`CLS = 0`)
- **Outstanding Failed Tests:** **0**
- **Items Requiring Human Verification:** Listed explicitly in Section 5 below and in `CONTENT_REVIEW.md`

---

## 2. Defects Found in Round 1 QA & Verified Resolved in Round 2

Running live-browser verification caught three real issues that were immediately resolved, rebuilt, and re-verified in Round 2:

| # | Severity | Defect Discovered (Round 1) | Root Cause | Fix Applied & Round 2 Verification |
| :-: | :--- | :--- | :--- | :--- |
| 1 | High | Mobile (`390×844`) header pill bar overflowed right edge, pushing `"Menu"` button offscreen | Unlayered `.btn-pill { display: inline-flex; }` in `globals.css` overrode Tailwind v4 `@layer utilities` `hidden sm:inline-flex` | Moved `.btn-pill` and component primitives into `@layer components` in `src/app/globals.css`. **Verified PASS** across `/`, `/doctors/`, `/opening-hours/`, `/contact-us/` (`Menu` button cleanly inside `x=270..361px`, `0px` overflow). |
| 2 | High | Clicking `"Close menu"` (`×`) inside mobile `#mobile-nav-drawer` `<dialog>` did not close it (only `Escape` worked) | `<dialog>` sat inside `<header class="... pointer-events-none">` and inherited `pointer-events: none` | Added explicit `pointer-events: auto` to `dialog.ks-drawer`, `.ks-drawer-panel`, and `dialog.ks-lightbox`. **Verified PASS** via normal pointer click open and close. |
| 3 | Low | Inner pages rendered duplicated `<title>` suffix (`... \| Karen Surgery \| Karen Surgery`) | `layout.tsx` `title.template` applied on top of `buildMetadata()`'s manual `\| Karen Surgery` suffix | Passed `title: { absolute: fullTitle }` in `src/lib/seo.ts` and added regression assertion to `scripts/qa-audit.mjs`. **Verified PASS** across all 13 pages. |
| 4 | Polish | `/doctors/` highlighted both `"Our Team"` and `"Services"` nav pills simultaneously; Opening Hours cards were ordered `01, 02, 05, 03, 04` | Shared dropdown href matching & non-sequential visual card numbering | Scoped primary active pill ownership cleanly in `SiteHeader.tsx` and sequenced Opening Hours badges `01`–`05`. **Verified PASS** visually and in DOM. |

---

## 3. Passed Tests Matrix (All 20 Section 12 Criteria)

| # | Requirement | Status | Verification Evidence |
| :-: | :--- | :---: | :--- |
| 1 | Every page loads cleanly (HTTP 200) | **PASS** | All 13 routes (`/`, `/about/`, `/team/`, `/services/`, `/doctors/`, `/mental-health/`, `/physiotherapy/`, `/allied-health-professionals/`, `/laboratory-services/`, `/opening-hours/`, `/medical-info/`, `/location/`, `/contact-us/`) + `sitemap.xml`, `robots.txt`, `404.html` verified HTTP 200. |
| 2 | Every navigation item works | **PASS** | Desktop dropdowns (`Our Team`, `Services`, `Patient Info`) toggle `aria-expanded` and dismiss on `Escape` and outside click; all links resolve to valid pages. |
| 3 | Every internal link works (zero dead links) | **PASS** | Automated crawl of all `href="/..."` attributes across all 13 exported HTML files confirmed `0` dead internal links. |
| 4 | Telephone links formatted correctly (`tel:`) | **PASS** | 30 unique `tel:+254...` links verified across reception, emergency phone, ambulance directories, lab partners, and practitioner profiles. |
| 5 | WhatsApp links formatted correctly | **PASS** | `https://wa.me/254733642246` verified on Homepage, Opening Hours, Contact Us, Footer, and Mobile Drawer. |
| 6 | Email links formatted correctly (`mailto:`) | **PASS** | 13 unique `mailto:` links verified including `mailto:Receptionist@KarenSurgery.com` and individual practitioners. |
| 7 | Images load cleanly | **PASS** | All 24 optimized assets generated as `.avif`, `.webp`, and `.jpg` with explicit `width`/`height`; 0 failed image network requests in live browser across all 13 routes. |
| 8 | Practitioner photographs match profiles | **PASS** | Automated check confirmed `19/19` personnel matched to their verified original photos; all 24 originals were also visually inspected prior to build. |
| 9 | No original content accidentally omitted | **PASS** | Every original page, bio, schedule, lab detail, vaccine notice, link, and disclaimer migrated from `karensurgery.com`. |
| 10 | No invented content introduced | **PASS** | Zero fabricated clinicians, qualifications, testimonials, ratings, statistics, or AI-generated portraits. |
| 11 | Mobile navigation works | **PASS** | `#mobile-nav-drawer` `<dialog>` opens and closes cleanly on pointer click and `Escape` at `390×844`, surfacing Reception Call, WhatsApp, and Emergency phone. |
| 12 | Responsive layouts work | **PASS** | Verified at `1440×900` desktop and `390×844` mobile with visual screenshot inspection. |
| 13 | Emergency contact information is correct | **PASS** | `+254 (0) 724 840246`, daylight 7am–7pm 365-day rule, no-night-calls policy, and verbatim ambulance directories verified and clearly separated from routine enquiries. |
| 14 | Opening hours displayed distinctly | **PASS** | All 5 schedules (`01` Receptionist Anne Ragui, `02` Doctors' Consulting, `03` Other Health Professionals, `04` Doctors' After Hours, `05` Night Calls) verified distinct. |
| 15 | No JavaScript console errors | **PASS** | `0` console errors and `0` uncaught exceptions across all 13 routes in live Chromium. |
| 16 | No broken images | **PASS** | `0` broken local images/sources in both disk audit and live browser network audit. |
| 17 | No dead internal links | **PASS** | `0` broken internal hrefs across the entire static build. |
| 18 | No horizontal overflow | **PASS** | `0px` horizontal overflow across Desktop (`1440×900`) and Mobile (`390×844`) after Round 2 header cascade fix. |
| 19 | SEO metadata & structured data present | **PASS** | Unique `<title>`, `<meta name="description">`, canonical URLs, Open Graph tags, single `<h1>`, `lang="en"`, `sitemap.xml`, `robots.txt`, and `MedicalClinic` JSON-LD verified on all 13 routes. |
| 20 | Production build succeeds | **PASS** | `npm run typecheck && npm run build` succeeded cleanly (`19/19` static routes exported cleanly in ~2s). |

### Interactive Feature Verification
- **Pillars Carousel (`/`):** Horizontal scroll buttons (`‹` / `›`) verified moving card track cleanly.
- **Team Directory Search & Filter (`/team/`):** Searching `"Kitulu"` narrowed 19 → 1 card; filtering `"Mental Health (3)"` showed 3 verified profiles.
- **Physiotherapy Specialisation Filter (`/physiotherapy/`):** Selecting `"Pelvic Health"` filtered 4 → 1 profile (`Sarah Peacock`).
- **Accessible Lightbox Modal (`/medical-info/`):** `"Expand full view"` opened native `<dialog>` and `"Close"` dismissed it cleanly.

---

## 4. Lighthouse Audit Results (Live Headless Chrome, Mobile Profile)

Tested directly against the local static production export (`http://127.0.0.1:4173/`):

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/` (Homepage) | **99** | **100** | **100** | **100** | 1.7 s | 1.7 s | 30 ms | **0** |
| `/doctors/` | **100** | **100** | **100** | **100** | 1.4 s | 1.4 s | 30 ms | **0** |
| `/contact-us/` | **99** | **100** | **96** | **100** | 1.5 s | 1.5 s | 90 ms | **0** |

### Documented Limitations (Local vs Production VM)
- Local preview used Python's `http.server` (no HTTP/2, no Gzip/Brotli, no `Cache-Control` headers, no HTTPS). Once deployed behind `deploy/nginx-karen-surgery.conf` with HTTPS + Gzip + immutable static asset caching, network latency and cache audits improve further.
- `/location/` embeds Google Maps via an `<iframe>` (`loading="lazy"`, zero API key exposure); Google Maps iframe third-party cookies/scripts only load when visitors scroll to the map on `/location/`.

---

## 5. Items Requiring Human Verification

1. **Clinical & Content Sign-Off (`CONTENT_REVIEW.md`):**
   - Confirm Fabian Collis's active email (`Collisfabian@gmail.com` vs legacy `mailto:Collis@wananchi.com`).
   - Confirm removal of the duplicated Megan Anjeri sentence accidentally pasted into Alice Coulson's live bio, plus Alice Coulson's website URL (`https://www.aliceshealthykitchen.com`).
   - Verify potentially outdated clinical statements on `/medical-info/` (2022 flu vaccine, HPV stock status, 2021/2025 US CDC graphics, 2015 GI Symbol links).
   - Verify all ambulance phone numbers (especially 6-digit local numbers `020 699222` AMREF switchboard and `020 343 999` St John's) and confirm whether the Opening Hours and Contact Us ambulance lists should be unified.
   - Verify time-sensitive details in practitioner bios (e.g., NHIF reference, active clinic roster, years of experience) and `"Nakumatt Junction"` label on the schematic map.
2. **Real Mobile Device Verification:**
   - Tap `tel:` links and `https://wa.me/254733642246` on a physical iOS/Android handset to verify carrier dialing and WhatsApp chat handoff.
   - Visually inspect Google Maps pin accuracy (`-1.32459, 36.70260`, 333 Ngong Road, Karen) on mobile.
3. **Production VM Post-Deployment Checks (Phase 6):**
   - Run final HTTPS, TLS renewal, Nginx security header, `301` redirect, and external route checks once deployed to the target Linux VM.
