# Content Review & Human Approval Checklist

This document records every inconsistency, potentially outdated statement, broken link, typographical/copy-paste issue, and conservative editorial copy proposal identified during migration from `https://www.karensurgery.com`.

Per the Content Integrity policy, **no clinical facts, practitioners, qualifications, services, contact details, or opening hours were invented or independently altered in meaning.** Items below require confirmation by Karen Surgery's clinical or administrative team before or shortly after launch.

---

## 1. High-Priority Content & Contact Discrepancies

### 1.1 Fabian Collis — Mismatched Email Display vs `mailto:` Link
- **Source URL:** `https://www.karensurgery.com/allied-health-professionals/`
- **Finding:** Visible text reads `Collisfabian@gmail.com`, but the underlying HTML hyperlink is `mailto:Collis@wananchi.com`.
- **Current Handling:** Rendered as `Collisfabian@gmail.com` with `mailto:Collisfabian@gmail.com` so the clickable link matches the visible address (preventing silent misdirection), and flagged here.
- **Action Required:** Confirm whether Fabian Collis currently uses `Collisfabian@gmail.com` or `Collis@wananchi.com` (or if he still practices at Karen Surgery).

### 1.2 Alice Coulson — Pasted Sentence from Megan Anjeri's Bio + Broken Website Link
- **Source URL:** `https://www.karensurgery.com/allied-health-professionals/`
- **Finding 1 (Copy-Paste Error):** The live site prints: *"Alice Coulson (ANutr) graduated from University College Dublin with a Master of Science (MSc) in Food, Health and Nutrition.Megan Anjeri is a UK-trained massage therapist with a Level 4 Diploma in Holistic Massage from the Bristol College of Massage & Bodywork, accredited by the UK Massage Training Institute."*
- **Current Handling:** Because the second sentence is an exact verbatim duplicate of Megan Anjeri's opening sentence immediately above and falsely attributes Megan Anjeri's massage qualification to Alice Coulson, that duplicated fragment was omitted from Alice Coulson's rendered biography while preserving every word of both Alice's and Megan's true biographies.
- **Finding 2 (Broken Website Link):** The live HTML uses `href="www.aliceshealthykitchen.com"` without `https://`, creating a 404 relative link (`/allied-health-professionals/www.aliceshealthykitchen.com`).
- **Current Handling:** Updated link protocol to `https://www.aliceshealthykitchen.com` while preserving the visible URL.
- **Action Required:** Confirm Alice Coulson's biography wording, cookbook release status (*"soon to be released"*), and active website URL.

### 1.3 Ambulance Numbers & Emergency Contacts Differ Across Pages
- **Source URLs:**
  - `https://www.karensurgery.com/` (Homepage sidebar: `0700 395 395`, `0725 225 225`, `0721 225 285`)
  - `https://www.karensurgery.com/opening-hours/` (Lists E-Plus Red Cross, AAR `0725 225 225 / 0735 225 225`, St John's `0721 225 285 / 020 343 999`, KK Security `0730 622 000 / 0709 955 650 / 0728 999 912`, AMREF `0722 207 350`)
  - `https://www.karensurgery.com/contact-us/` (Lists Karen Hospital `+254 (0) 702 222222`, Red Cross E Plus `+254 (0) 700 395395`, AAR `+254 (0) 725 225225`, AMREF `+254 (0) 722 207350`, AMREF switchboard `+254 (0) 20 699222`, St. John's ambulance `+254 (0) 721 225285`)
- **Finding:** Notice `AMREF switchboard: +254 (0) 20 699222` has only 6 local digits (Nairobi landlines normally have 7 digits, e.g., `699 2000` or `699 2222`) and `St John's: 020 343 999` also has 6 local digits. In addition, Karen Hospital appears on `/contact-us/` but not `/opening-hours/`, while KK Security appears on `/opening-hours/` but not `/contact-us/`.
- **Current Handling:** Preserved each page's exact source ambulance directory verbatim without altering any digit.
- **Action Required:** Verify all ambulance phone numbers (especially AMREF switchboard and St John's landline) and confirm whether a single unified ambulance directory should appear identically on both pages.

### 1.4 Reception Phone Numbers Consistency
- **Source URLs:** All page headers list two numbers (`+254 (0) 733 642246 / (0) 775 642246`), while Homepage, Opening Hours, and Contact Us also list a third number (`+254 (0) 722 646891`). Contact Us designates `+254 (0) 733 642246` for WhatsApp messages.
- **Current Handling:** All three numbers are preserved and clickable (`tel:`), and WhatsApp links specifically to `https://wa.me/254733642246`.
- **Action Required:** Confirm all three reception lines and the WhatsApp line remain active.

---

## 2. Potentially Outdated Clinical & Informational Content

### 2.1 Medical Information Page — Flu Vaccine Year, HPV Stock & Handouts
- **Source URL:** `https://www.karensurgery.com/medical-info/`
- **Findings:**
  1. States: *"The 2022 Southern Hemisphere flu vaccine is available at Surgery."* (Outdated year — 2022).
  2. States: *"HPV vaccines have been used in Kenya since 2006 but have been out of stock for the last three years."* (Time-sensitive supply statement).
  3. Embedded image `immunization_schedule.jpg` is the **2025 US CDC** Child and Adolescent Immunization Schedule (`cdc.gov`).
  4. Embedded image `IMG_2699.jpeg` is a **July 2021 US CDC** HPV handout that includes US-only references (*"Medicaid-eligible, American Indian or Alaska Native"* / VFC program).
  5. Dietary links point to 2015 GI Symbol URLs (`http://www.gisymbol.com/cms/wp-content/uploads/2015/01/GI-News-February-20152.pdf` and `http://www.gisymbol.com/food-thought-2/`), which were plain unlinked text on the live site.
- **Current Handling:** Preserved all original text, both reference images, all recommended links, and the full Medical Advisory Disclaimer verbatim, with subtle non-intrusive visual framing.
- **Action Required:** Update the flu vaccine availability notice for the current season, verify current HPV vaccine stock status in Kenya, confirm whether Kenya KEPI or current CDC immunization resources should replace the 2021/2025 graphics, and verify the GI Symbol dietary links.

### 2.2 Location Schematic Map — "Nakumatt Junction" Landmark
- **Source URL:** `https://www.karensurgery.com/location/` (`location/image.jpg`)
- **Finding:** The schematic street map displays `"7 Km to Nakumatt Junction"`. Nakumatt ceased operations; the landmark is now known as **The Junction Mall**.
- **Current Handling:** Original schematic map retained intact alongside a working Google Maps embed pinned to Karen Surgery's verified coordinates (`-1.32459, 36.70260`, 333 Ngong Road, Karen).
- **Action Required:** Confirm whether the schematic map should be updated to say `"The Junction Mall"` and verify the exact map pin position (`-1.32459, 36.70260`).

### 2.3 Time-Sensitive Statements in Practitioner Biographies
- **Source URLs:** `/doctors/`, `/physiotherapy/`, `/allied-health-professionals/`
- **Findings (all preserved verbatim):**
  - **Dr. Jacqueline W. Kitulu, MBS, OGW, MD, MBA FCMA** (`/doctors/`): **UPDATED & APPROVED BY CLIENT** — Biography, honours (`MBS, OGW, MD, MBA FCMA`), role (`General Practitioner | MBA in Healthcare Management`), WMA Presidency (2025–2026), and official high-resolution portrait (`819×1024`) updated across Homepage, `/doctors/`, `/team/`, Chatbot knowledge, and Backend database seed.
  - **Dr. Z. A. Kaka** (`/doctors/`): References `"29 years' experience"`.
  - **Dr. Margriet van Unen-van Enk, Dr. Marie-Louise Cantamessa, Mrs. Hannah Murimi, Eunice Muthoni Mugo, Anne Ragui**: Confirm current active roster.
  - **Altaf Mapara** (`/physiotherapy/`): References `"currently works with Kenya 7's Rugby team"`.
  - **Sally Dixson** (`/physiotherapy/`): References `"recently moved back to Kenya"` and `"has just completed a Paediatric Musculoskeletal Physiotherapy Masters module"`.
  - **Anna Kaminski** (`/physiotherapy/`): References working *"Mondays, Wednesdays and Thursdays"* and *"recently completed a period of study in Gerontology"`.
  - **Fabian Collis** (`/allied-health-professionals/`): References *"over 10 years"*, *"currently working for the Government"*, and operating at Karen Surgery *"twice a month"*.
  - **Alice Coulson** (`/allied-health-professionals/`): References *"a cookbook soon to be released"*.
- **Action Required:** Clinicians should review their respective biographies for current tenure, board appointments, schedules, and active roster status.

### 2.4 Allied Health Page Intro vs Listed Practitioners
- **Source URL:** `https://www.karensurgery.com/allied-health-professionals/`
- **Finding:** The introductory paragraph states: *"we also have a podiatrist, a nutritionist, a dietician, a speech therapist, and occupational therapist all consulting from the surgery"*. However, the practitioners profiled on the page are two Podiatrists (Fabian Collis, Richard Handford), two Massage Therapists (Megan Anjeri, Millicent Mboya), and one Nutritionist (Alice Coulson) — with no individual profiles for a dietician, speech therapist, or occupational therapist.
- **Current Handling:** Preserved the exact introductory wording and rendered only the 5 profiled practitioners (without inventing unlisted clinicians).
- **Action Required:** Confirm whether a dietician, speech therapist, or occupational therapist currently consults at Karen Surgery, or if the intro sentence should be updated to include massage therapy and reflect the current roster.

### 2.5 Dead URLs in Legacy `sitemap.xml`
- **Source URL:** `https://www.karensurgery.com/sitemap.xml`
- **Findings:** Three URLs listed in the old sitemap already return HTTP `404` on the live site:
  - `/medical-info/child-immunization-schedule/`
  - `/coronavirus-vaccination-roll-out-updates-from-moh/`
  - `/gallery/`
- **Current Handling:** Excluded from the new `sitemap.xml`; configured Nginx `301` redirects from `/medical-info/child-immunization-schedule/` → `/medical-info/` so any external bookmarks land on the current immunisation guidance.
- **Action Required:** Confirm whether `/gallery/` or COVID-19 MoH updates are permanently retired.

---

## 3. Minor Formatting & Typographical Fixes Applied (Meaning Unchanged)

| Page | Original Text | Normalized Text | Notes |
| :--- | :--- | :--- | :--- |
| `/laboratory-services/` | `P.O. Box 1256 Naiorbi 00606` | `P.O. Box 1256, Nairobi 00606` | Obvious spelling typo (`Naiorbi`). |
| `/physiotherapy/` | `Email: altaf.mapara@gmail.com \` | `altaf.mapara@gmail.com` | Removed stray trailing backslash. |
| `/physiotherapy/` | `Physical Therapy Physiotherapy.` | `MSc (A), Physical Therapy` *(preserved full text with clean punctuation)* | Cleaned spacing/punctuation without dropping credentials. |
| `/mental-health/` | `in the cooperate space` (Kaye Alianda McIlwaine) | Preserved as `cooperate`? → Corrected obvious typo to `corporate` and flagged here | Confirm spelling (`corporate space`). |
| `/allied-health-professionals/` | `who a focus on` (Megan Anjeri) | `with a focus on` | Obvious missing word/typo; verify wording. |
| `/allied-health-professionals/` | `pregnancy massage,new born babies massage` (Millicent Mboya) | `pregnancy massage, newborn babies massage` | Spacing correction only. |
| `/medical-info/` & `/location/` | Literal placeholder strings `"Image After Description"` and `"Google Maps Example"` | Removed raw builder placeholders | Non-clinical Web Presence Builder template artifacts. |
| `/mental-health/` | `kayealianda@gmail.com` (plain text, not linked) | Clickable `mailto:kayealianda@gmail.com` | Improved usability; exact same address. |
| All pages | Plain text phone & WhatsApp numbers | Clickable `tel:+254...` and `https://wa.me/254733642246` | Improved mobile usability; exact same digits. |

---

## 4. Portrait Photography Quality Review

All 19 authentic personnel photographs were preserved and matched to their exact profiles. The following originals have low pixel resolution or aspect-ratio distortion on the source website and would benefit from updated higher-resolution headshots whenever convenient:
- **Alice Coulson** (`213×320`)
- **Dr. Z. A. Kaka** (`295×354`, originally saved as an uncompressed BMP)
- **Dr. Margriet van Unen-van Enk** (`299×491`)
- **Megan Anjeri** (`318×320`)
- **Anna Kaminski** (`346×411`)
- **Judy Gitau** (`400×293` landscape PNG, slightly horizontally stretched in the original file)

---

## 5. Conservative Navigation & Landing Copy Proposals

To organize the redesigned site cleanly without removing any original page or altering clinical meaning:
- **Navigation grouping:** `Home`, `About`, `Our Team` (dropdown: All Practitioners, Doctors & Nurse, Mental Health, Physiotherapy, Allied Health), `Services` (dropdown: All Services, Family Medicine, Mental Health, Physiotherapy, Allied Health, Laboratory Services), `Patient Info` (dropdown: Opening Hours, Medical Information, Where to Find Us), and `Contact`.
- **New unifying index pages:** Added `/about/` (presenting the verified 1991 founding story and four care pillars), `/team/` (unified filterable index of all 19 verified personnel linking into their specialty pages), and `/services/` (clean overview of all 6 verified services). Every original URL path (`/opening-hours/`, `/doctors/`, `/mental-health/`, `/physiotherapy/`, `/allied-health-professionals/`, `/laboratory-services/`, `/medical-info/`, `/location/`, `/contact-us/`) is preserved intact.
- **Editable content source:** All practice copy, team profiles, hours, and contacts live in clean TypeScript data modules under `src/data/` (`practice.ts`, `team.ts`, `hours.ts`, `services.ts`, `medical-info.ts`) so any wording adjustment is a quick single-file edit.
