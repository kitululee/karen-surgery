# Discovery Report — Karen Surgery Website Redesign

**Audit Date:** 2026-11-19  
**Primary Source of Truth:** `https://www.karensurgery.com`  
**Design Inspiration:** `https://www.pinterest.com/pin/1001276929675130938/` ("SYNORA — Multi-Specialty Medical Clinic" by `uixshuvo`, sourced from Dribbble shot `27616287-Healthcare-Clinic-Platform`)

---

## 1. Existing Website Architecture & Platform Audit

The live `karensurgery.com` website is built with **Plesk Web Presence Builder 18.0.54**, using fixed-width legacy table/div widget layouts, jQuery (`jquery.min.js`), inline widget CSS, and no mobile viewport responsiveness.

### Live Pages Inventory (10 Active Pages, 3 Dead Sitemap URLs)

| Original URL | Status | Page Title | Summary of Authoritative Content |
| :--- | :---: | :--- | :--- |
| `/` | 200 | Family Medical Practice - Karen Surgery | Practice tagline (*"Karen Surgery : Health Care the way it should be."*), 1991 founding story, 4 care pillars (Convenient, Comprehensive, Collaborative, Cost effective), telephone contacts, emergency line, ambulance summary, building & entrance photos. |
| `/opening-hours/` | 200 | Opening Hours - Karen Surgery | 5 distinct schedules: Receptionist (Anne Ragui + portrait), Doctors' Consulting Hours, Doctors' After Hours Service (7am–7pm, 365 days), Night Calls policy + 5 ambulance providers, Other Health Professionals hours. |
| `/doctors/` | 200 | Doctors & Nurse - Karen Surgery | 3 General Practitioners (Dr. Margriet van Unen-van Enk, Dr. Marie-Louise Cantamessa, Dr. Jacqueline Kitulu), Practice Nurse (Mrs. Hannah Murimi), Consultant Radiologist / Ultrasound Services (Dr. Z. A. Kaka + 7 ultrasound types), Office Assistant (Eunice Muthoni Mugo). |
| `/mental-health/` | 200 | Mental Health Professionals - Karen Surgery | Multidisciplinary mental health overview, specialist interests, self-referral & GP collaboration, 3 profiles: Dr. Tonya Shaw, Judy Gitau, Kaye Alianda McIlwaine. |
| `/physiotherapy/` | 200 | PHYSIOTHERAPY - Karen Surgery | Multidisciplinary physiotherapy overview, self-referral & GP/nutritionist collaboration, 4 profiles: Anna Kaminski, Altaf Mapara, Sally Dixson, Sarah Peacock. |
| `/allied-health-professionals/` | 200 | Allied Health Professionals - Karen Surgery | Multidisciplinary intro, 5 profiles: Fabian Collis (Podiatrist), Megan Anjeri (Massage Therapist), Millicent Mboya (Massage Therapist), Richard Handford (Podiatrist), Alice Coulson (Nutritionist). |
| `/laboratory-services/` | 200 | Laboratory Services - Karen Surgery | Specimen collection by practice nurse, courier schedule (9:30 am CTTM, 1:00 pm Pathcare), same-day cash/M-Pesa payment policy, partner contact details for CTTM and Pathcare Kenya Ltd. |
| `/medical-info/` | 200 | Medical Information - Karen Surgery | 2022 Southern Hemisphere flu vaccine notice, WHO HPV vaccine info, immunisation schedule guidance, 2 CDC reference images (2025 US Child/Adolescent schedule; July 2021 HPV handout), recommended travel/Dutch/dietary links, formal medical advisory disclaimer. |
| `/location/` | 200 | Location - Karen Surgery | Physical address (333 Ngong Road, Karen, 333m from Karen roundabout), schematic street map image, broken/misconfigured Google Maps JS embed (Nairobi CBD center vs marker at `-1.32459, 36.70260`, exposed API keys, placeholder `YOUR_MAP_ID`). |
| `/contact-us/` | 200 | Contact Us - Karen Surgery | Reception email (`Receptionist@KarenSurgery.com`), 3 telephone numbers, WhatsApp number (`+254 (0) 733 642246`), Emergencies-only phone (`+254 (0) 724 840246`), emergency warning banner, 6 ambulance numbers. |
| `/medical-info/child-immunization-schedule/` | 404 | — | Listed in `sitemap.xml` (2023-08-07) but returns HTTP 404. |
| `/coronavirus-vaccination-roll-out-updates-from-moh/` | 404 | — | Listed in `sitemap.xml` (2023-08-07) but returns HTTP 404. |
| `/gallery/` | 404 | — | Listed in `sitemap.xml` (2023-08-07) but returns HTTP 404. |

**Downloadable Documents:** None found (`0` PDF/DOCX assets).  
**Online Booking / Patient Portal / Forms:** None exist on the live site; all bookings occur via telephone, WhatsApp, or email to reception or directly to specific mental health, physiotherapy, or allied health practitioners.  
**Logo / Favicon:** No standalone graphic logo file exists; `favicon.ico` is `0 bytes`. Existing brand identity relies on typography (*KAREN SURGERY — Family Medical Practice*), botanical olive-green site tones (`#5C743D`, `#577A25`, `#F4FFE4`), and the distinctive dark olive timber building with red veranda doors/windows (`Surgery-building-1-website-2019.JPG`).

---

## 2. Pinterest Visual Design Reference Analysis

Direct visual inspection of `https://www.pinterest.com/pin/1001276929675130938/` (`i.pinimg.com/originals/ea/3f/b7/ea3fb70824ddcc95871ee6145ce744ae.png`) revealed the **"SYNORA — Multi-Specialty Medical Clinic"** layout:

- **Composition & Rhythm:** Clean alternating bands on a pure white (`#FFFFFF`) canvas: (1) full-bleed atmospheric photographic hero with inset frosted-glass pill navbar, left-aligned display headline + dual pill CTAs, right-aligned stacked factual anchors, and grounded bottom narrative/scroll cue; (2) asymmetric split-header horizontal 4-card editorial strip with tall pill prev/next controls; (3) split-header specialty tile grid on soft neutral `#F6F7F8` cards with clean icon badges.
- **Typography:** 100% crisp Neo-Grotesque sans-serif with tight display tracking (`-0.025em`), airy uppercase hero headline incorporating a small rounded inline photo pill for human warmth, sentence-case semibold section titles, and readable restrained body paragraphs (`~50–60ch`).
- **Color Restraint:** Replaces cliché hospital-blue chrome with crisp white surfaces, ultra-light cool/stone gray tiles, deep obsidian (`#0D0E10`) pill CTAs, and atmospheric image scrims.
- **Adaptation for Karen Surgery:** Rather than mimicking sterile biotech/concierge aesthetics or inventing marketing KPIs (`20K+`, `4.9/5`), we fuse SYNORA's architectural clarity, frosted floating navbar, pill CTA language, and disciplined white/stone canvas with Karen Surgery's **real woodland-olive & terracotta-red architectural identity** photographed on Ngong Road — using verified factual anchors (`Est. 1991`, `333 Ngong Rd`, `7am–7pm Daylight Emergency Cover`, `6 Clinical Disciplines`) and authentic practice/team photography.

---

## 3. Existing Patient Journeys & Friction Points

### Core Patient Goals
1. **Understand the Practice:** Verify what services Karen Surgery offers, how GP continuity works, and insurance/payment policy (independent, completes insurance forms).
2. **Find a Clinician:** Browse doctors, practice nurse, radiologist, psychologists/counsellors, physiotherapists, and allied health practitioners with direct contact details.
3. **Check Hours Immediately:** Distinguish reception hours, doctors' routine morning consulting hours, afternoon urgent policy, 7am–7pm daylight after-hours emergency cover, and no-night-calls security policy.
4. **Contact Reception or Emergency Services:** Call, WhatsApp, or email reception for routine visits — or reach the emergency doctor / Nairobi ambulance services immediately without confusion.
5. **Find the Clinic:** Navigate to 333 Ngong Road (333m from Karen roundabout) using Google Maps or local landmarks.

### Critical Technical & UX Friction Points Identified
- **No mobile responsiveness:** Fixed desktop layout overflows mobile screens; phone numbers are plain text (not clickable `tel:` links) and WhatsApp is plain text (not a `wa.me` link).
- **Duplicate navigation:** Two identical 10-item menus appear stacked in header + sidebar on every page.
- **Exposed API keys & broken map:** `/location/` embeds raw Google Maps API keys in public HTML, centers on Nairobi CBD instead of Karen, and prints literal `"Google Maps Example"` and `"Image After Description"` strings.
- **Unoptimized media:** 24 images include a 307 KB BMP file disguised as `.jpg` (`Dr-Kaka-photo-for-website.jpg`), a 1.1 MB 400×293 PNG (`Judith-Gitau-pic-for-website_1.png`), and unresized 3024×4032 camera originals (~900 KB each) displayed at 100px width.
- **Content & link defects:** Copy-paste error in Alice Coulson's biography, mismatched email link for Fabian Collis, broken relative website URL for Alice Coulson, outdated 2022 flu vaccine / 2021 US CDC handout / "Nakumatt Junction" map text, and 3 dead sitemap URLs. All are documented verbatim in `CONTENT_REVIEW.md`.
