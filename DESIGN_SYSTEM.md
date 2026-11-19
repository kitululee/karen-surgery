# Design System & UX Direction — Karen Surgery

## 1. Creative Direction

Translates the architectural restraint and editorial poise of the **SYNORA** Pinterest reference (`pin/1001276929675130938`) into an authentic digital home for an established, independent Nairobi family practice founded in **1991**.

Rather than sterile corporate hospital-blue templates or generic AI gradients, the visual language pairs:
- **Editorial minimalism** from the inspiration (pure white canvas, soft stone cards, frosted-glass floating pill navigation, crisp neo-grotesque typography, disciplined spacing, and full-pill primary CTAs), with
- **Authentic Karen Surgery materiality** drawn directly from the practice's woodland timber building at 333 Ngong Road (deep forest-obsidian ink, calm botanical olive accents, and restrained heritage crimson reserved semantically for emergency care).

---

## 2. Color System

All foreground/background pairs exceed WCAG 2.1 AA contrast (`>= 4.5:1` for body text, `>= 3:1` for large headings and UI boundaries). Color is never used alone to convey state or urgency.

| Token | Hex | Role | Contrast Notes |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#FFFFFF` | Primary page canvas | Base surface |
| `--color-surface` | `#F6F7F5` | Subtle stone-sage tiles, schedule cards, side panels | Soft warmth echoing SYNORA `#F6F7F8` + Karen botanical heritage |
| `--color-surface-elevated` | `#EDF1EA` | Quiet botanical highlight bands (Mental Health / Philosophy) | Restrained tonal separation |
| `--color-border` | `#DFE4DC` | Hairline dividers & card edges (`1px`) | Clean structural definition |
| `--color-border-strong` | `#B8C2B4` | Interactive borders & button outlines (`>= 3:1` UI contrast) | Meets WCAG 1.4.11 |
| `--color-ink` | `#121713` | Primary text, headings, obsidian pill CTAs | `17.9:1` on `#FFFFFF` |
| `--color-ink-muted` | `#4A544C` | Body copy, captions, secondary metadata | `7.7:1` on `#FFFFFF`; `7.2:1` on `#F6F7F5` |
| `--color-forest` | `#2F4A2C` | Karen Surgery woodland accent (links, active states, editorial badges) | `9.7:1` on `#FFFFFF` |
| `--color-forest-soft` | `#E6EFE3` | Soft pill badges & current-page accents | Paired with `#1E351C` (`11.4:1`) |
| `--color-emergency` | `#9E252A` | Emergency phone, Night Calls warning, Ambulance callouts (echoes clinic's red doors) | `7.3:1` on `#FFFFFF` |
| `--color-emergency-bg` | `#FDF3F3` | Emergency callout surface with `#E4B4B6` border | High visibility without visual clutter |

---

## 3. Typography

Self-hosted variable WOFF2 fonts bundled cleanly via `next/font/local` (zero runtime and zero build-time external font CDN requests):
- **Display & Headings:** `Plus Jakarta Sans` (Weights `400, 500, 600, 700`) — geometric neo-grotesque clarity directly reflecting the SYNORA display voice.
- **Body & Clinical Copy:** `Inter` (Weights `400, 500, 600`) — high legibility for long-form clinician biographies, tabular telephone numbers (`font-variant-numeric: tabular-nums`), and schedules.

### Type Scale (Responsive `clamp()` with `rem` units; max <= 2.5× min for WCAG 1.4.4 200% zoom)
- **Hero Display (`h1.display`):** `clamp(2.25rem, 1.5rem + 3.2vw, 4.25rem)`, weight `500`, leading `1.04`, tracking `-0.03em`, `text-wrap: balance`.
- **Page Title (`h1`):** `clamp(2rem, 1.4rem + 2.2vw, 3.25rem)`, weight `600`, leading `1.1`, tracking `-0.025em`.
- **Section Heading (`h2`):** `clamp(1.625rem, 1.25rem + 1.4vw, 2.35rem)`, weight `600`, leading `1.15`, tracking `-0.02em`.
- **Subheading / Practitioner Name (`h3`):** `clamp(1.1875rem, 1.05rem + 0.5vw, 1.4rem)`, weight `600`, leading `1.28`.
- **Eyebrow / Micro-label:** `0.75rem`, weight `600`, tracking `0.12em`, uppercase.
- **Body Copy:** `1rem` (`16px`) / `1.0625rem` (`17px`), unitless `line-height: 1.65`, capped at `max-width: 65ch`, `text-wrap: pretty`.

---

## 4. Layout Rhythm & Component Architecture

- **Container:** Max width `1280px` (`80rem`), fluid inline padding `clamp(1.25rem, 4vw, 3rem)`.
- **Navigation (`SiteHeader`):**
  - Floating frosted-glass pill bar (`backdrop-filter: blur(14px)`) inset inside the homepage hero and docked smoothly across inner pages.
  - Single semantic `<nav aria-label="Primary">` landmark (no duplicate desktop/mobile trees where avoidable, or clean modal `<dialog>` mobile drawer with `showModal()`, scroll-snap dismiss, `Esc` support, and focus return per `modern-web-guidance` `navbar` & `navigation-drawer` guidance).
  - Desktop submenus use semantic `<button aria-expanded aria-controls>` triggers (not `<details>/<summary>` inside nav) with keyboard `Tab`/`Escape` and click-outside dismissal, and `aria-current="page"` on active links.
- **Pill Button Language:**
  - Primary: Solid forest-obsidian `#121713` pill (`border-radius: 9999px`), white text, min-height `44px` (WCAG 2.5.8 comfortable touch target).
  - Secondary: Crisp white pill with `1px solid #B8C2B4` border (or frosted translucent white over hero photography).
  - Emergency: Heritage crimson `#9E252A` pill with phone icon and clear label (`Emergency: +254 (0) 724 840246`).
- **Editorial Pillars Strip (Homepage Band 2):** Horizontally scrollable 4-card editorial strip with scroll-snap + accessible `‹` / `›` tall pill buttons (matching SYNORA's signature carousel geometry) showcasing Karen Surgery's exact 4 pillars of care.
- **Specialty Grid (Homepage Band 3):** Asymmetric split header + soft `#F6F7F5` rounded (`14px`) tiles with crisp `48×48` white icon badges for the 6 verified services.
- **Practitioner Profiles:** Respectfully framed portraits (`width: 192px–224px` desktop, matching source resolution so no authentic photo is stretched blurry), calibrated per-person `object-position` focal points, crisp credential line, full verbatim biography, and direct clickable `tel:` / `mailto:` / external links.
- **Accessible Lightbox (`<dialog>`):** Native modal `<dialog>` (`showModal()`) for expanding high-detail clinical graphics (2025 CDC Immunization Schedule, CDC HPV Guide, and Karen Roundabout Directions Map) with native `Esc` dismissal, backdrop click dismiss, and visible Close button.

---

## 5. Performance, Accessibility & Privacy Guardrails

- **Images:** Build-time `sharp` pipeline converts all 24 originals into `<picture>` sets (`.avif`, `.webp`, `.jpg`) with explicit `width` and `height`. Homepage LCP hero image receives `fetchpriority="high"` and `loading="eager"`; below-the-fold images use `loading="lazy"` alone (never combining `fetchpriority="low"` with `loading="lazy"` for standard below-the-fold images).
- **Motion:** Subtle compositor-only transitions (`opacity`, `translate`) wrapped inside `@media (prefers-reduced-motion: no-preference)`.
- **Forced Colors Mode:** High-contrast border/outline fallbacks via `@media (forced-colors: active)`.
- **Zero Tracking / Zero Third-Party Bloat:** No analytics scripts, no Google Fonts CDN calls at runtime, no exposed Google Maps API keys, no forms collecting patient health data.
