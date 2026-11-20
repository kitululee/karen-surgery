# Karen Surgery — Phase 2 API Documentation

**Base URL (Production):** `https://api.karensurgery.com`  
**Base URL (Local Dev):** `http://127.0.0.1:4000`  
**Framework:** Fastify 5 + Zod validation + Helmet + Rate Limiting  

---

## 1. Authentication & Security Conventions

- **Public endpoints (`/api/public/*`):** Unauthenticated, strictly read-only or validated public submission endpoints protected by per-route rate limits, Zod schema validation, honeypot spam checks, and minimum fill-time guards. Draft, archived, or unapproved CMS records are **never** returned on public routes.
- **Admin endpoints (`/api/admin/*`, `/api/auth/me`, `/api/auth/logout`):**
  - Authenticated via server-side opaque session cookie `ks_admin_session` (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
  - All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-CSRF-Token` header matching the active session's `csrfToken` returned by `/api/auth/login` or `/api/auth/me`.
  - Every endpoint enforces server-side RBAC permissions via `requireAuth("<permission>")`.

---

## 2. Public Endpoints

| Method | Path | Rate Limit | Purpose |
|---|---|---|---|
| `GET` | `/api/public/health` | Global | Health check returning `{ status: "ok", db: "sqlite" \| "postgres", timestamp }` |
| `GET` | `/api/public/booking-options` | Global | Returns published `services` + `other-verified-services` and active, approved, non-archived clinical `practitioners` (excluding support staff) with linked `serviceSlugs`. |
| `GET` | `/api/public/settings` | Global | Returns published practice settings (hours, contact, emergency, location, navigation, footer, chatbot config). |
| `GET` | `/api/public/pages/:slug` | Global | Returns published page metadata and published `sections` only (`404` for drafts/archived). |
| `POST` | `/api/public/appointments` | 8 / 10 min | Creates an appointment request (`status: "new"`), resolves email routing (practitioner -> service -> reception), dispatches minimal notification email, returns `201` with `KS-APT-...` reference and non-confirmed acknowledgement. |
| `POST` | `/api/public/enquiries` | 10 / 10 min | Creates a general enquiry (`source: "contact_form"` or `"chatbot"`), routes minimal notification to `Receptionist@KarenSurgery.com`, returns `201` with `KS-ENQ-...` reference. |
| `GET` | `/api/public/chatbot/config` | Global | Returns chatbot `enabled` flag, `welcomeMessage`, `suggestedQuestions`, and verified `escalation` contacts. |
| `POST` | `/api/public/chatbot/ask` | 30 / 5 min | Runs emergency guardrail -> clinical advice refusal -> active practitioner lookup -> published & approved FAQ matching -> out-of-scope fallback (logging unanswered question and returning editable `draftEnquiry`). |

### Example: `POST /api/public/appointments`

**Request Body:**
```json
{
  "fullName": "Jane Wanjiku",
  "phone": "+254712345678",
  "email": "jane@example.com",
  "patientType": "new",
  "serviceSlug": "family-medicine",
  "practitionerId": 1,
  "preferredDate": "2026-12-01",
  "preferredTime": "Morning (8:00 am – 1:00 pm)",
  "preferredContact": "phone",
  "message": "Routine family check-up",
  "privacyAccepted": true,
  "websiteUrl": "",
  "startedAt": 1763628000000
}
```

**Response (`201 Created`):**
```json
{
  "referenceCode": "KS-APT-20261120-A1B2C3",
  "status": "new",
  "serviceLabel": "Family Medicine & Nursing",
  "practitionerName": "Dr. Margriet van Unen-van Enk",
  "routedTo": "Karen Surgery Reception",
  "acknowledgement": "Your appointment request has been received. Please note this is not yet a confirmed booking — our reception team or practitioner will contact you to confirm availability."
}
```

---

## 3. Authentication Endpoints

| Method | Path | Rate Limit / Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | 8 / 15 min | Verifies email + Argon2id password, sets `ks_admin_session` cookie, returns `{ user, csrfToken }`. Writes `auth.login` audit log. |
| `GET` | `/api/auth/me` | Session required | Returns authenticated `{ user, csrfToken }`. |
| `POST` | `/api/auth/logout` | Session + CSRF | Deletes session from DB, clears cookie, writes `auth.logout` audit log. |
| `POST` | `/api/auth/forgot-password` | 5 / 15 min | Generates single-use 30-min token (SHA-256 hashed in DB) and emails reset link (anti-enumeration generic 200 response). |
| `POST` | `/api/auth/reset-password` | 5 / 15 min | Validates token, enforces 12+ character password policy, updates Argon2id hash, revokes all active sessions for user. |

---

## 4. Administrative Operations Endpoints (`/api/admin/*`)

### Dashboard & Staff Lookup
| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | `dashboard.read` | Live DB statistics: pending/total appointments, open/chatbot enquiries, active/archived practitioners, published/draft pages, published FAQs, open unanswered questions, and recent activity. |
| `GET` | `/api/admin/staff-assignees` | `dashboard.read` | Lists active staff accounts for appointment/enquiry assignment dropdowns. |

### Appointments & Enquiries
| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/appointments` | `appointments.read` | Filterable list (`status`, `service`, `practitionerId`, `q`) with joined assignee metadata. |
| `PATCH` | `/api/admin/appointments/:id` | `appointments.write` | Updates `status`, `assignedToUserId`, and private `internalNotes`; records `confirmed_at`/`completed_at`/`cancelled_at` and audit entry. |
| `GET` | `/api/admin/enquiries` | `enquiries.read` | Filterable list (`status`, `source`, `category`, `q`). |
| `PATCH` | `/api/admin/enquiries/:id` | `enquiries.write` | Updates `status`, `assignedToUserId`, `internalNotes`, and `followUpNotes`; records `resolved_at` and audit entry. |

### Content CMS, Practitioners, Services & Media
| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/pages` | `cms.read` | Lists all pages with section counts. |
| `POST` | `/api/admin/pages` | `cms.write` | Creates a new page (`draft` / `published` / `archived`). |
| `GET` | `/api/admin/pages/:id` | `cms.read` | Returns page details and ordered sections. |
| `PATCH` | `/api/admin/pages/:id` | `cms.write` | Updates page title, SEO metadata, or publish status. |
| `POST` | `/api/admin/pages/:id/sections` | `cms.write` | Creates a new structured section on a page. |
| `PATCH` | `/api/admin/sections/:id` | `cms.write` | Updates section heading, subheading, body JSON, CTA, media, order, or publish flag. |
| `GET` | `/api/admin/practitioners` | `cms.read` | Lists all practitioners (including inactive/archived) with linked service IDs. |
| `POST` | `/api/admin/practitioners` | `cms.write` | Creates a practitioner record and service category links. |
| `PATCH` | `/api/admin/practitioners/:id` | `cms.write` | Updates profile fields, active/approved/archived status, direct email, portrait, or service links. |
| `GET` | `/api/admin/services` | `cms.read` | Lists all practice service categories. |
| `POST` | `/api/admin/services` | `cms.write` | Creates a service category. |
| `PATCH` | `/api/admin/services/:id` | `cms.write` | Updates service title, description, highlights, routing email, or publish status. |
| `GET` | `/api/admin/media` | `cms.read` | Lists all media assets with live `inUseCount` reference checks. |
| `POST` | `/api/admin/media/upload` | `cms.write` | Multipart image upload validated by magic bytes (JPEG/PNG/WebP/AVIF, max 5 MB), stored with sanitized random filename. |
| `PATCH` | `/api/admin/media/:id` | `cms.write` | Updates alt text metadata. |
| `DELETE` | `/api/admin/media/:id` | `cms.write` | Deletes an unused non-system media asset; returns `409 Conflict` if referenced or system-protected. |

### Chatbot Knowledge, Settings, Users & Audit Logs
| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/chatbot/faqs` | `chatbot.read` | Lists all chatbot FAQs (published & draft). |
| `POST` | `/api/admin/chatbot/faqs` | `chatbot.write` | Adds a new FAQ entry with keywords and publish/approval flags. |
| `PATCH` | `/api/admin/chatbot/faqs/:id` | `chatbot.write` | Updates FAQ text, keywords, or publish/approval status. |
| `DELETE` | `/api/admin/chatbot/faqs/:id` | `chatbot.write` | Removes an FAQ entry. |
| `GET` | `/api/admin/chatbot/unanswered` | `chatbot.read` | Lists unanswered visitor questions queue. |
| `PATCH` | `/api/admin/chatbot/unanswered/:id` | `chatbot.write` | Marks unanswered question as `reviewed`/`dismissed`, or converts directly into a new FAQ. |
| `GET` | `/api/admin/settings` | `cms.read` | Retrieves singleton website settings. |
| `PATCH` | `/api/admin/settings` | `settings.write` | Updates opening hours, routine contact details, location, navigation, footer, chatbot config, and retention policy. |
| `PATCH` | `/api/admin/settings/emergency` | `settings.emergency` | **SUPER_ADMIN only.** Requires explicit `{ confirmPhrase: "CONFIRM EMERGENCY CHANGE" }` double confirmation before modifying emergency numbers or banners. |
| `GET` | `/api/admin/users` | `users.read` | Lists admin accounts and available roles. |
| `POST` | `/api/admin/users` | `users.write` | Creates a new staff user with Argon2id hashed password (min 12 chars). |
| `PATCH` | `/api/admin/users/:id` | `users.write` | Updates role, active status, name, or password (revoking existing sessions on deactivation or password reset). |
| `GET` | `/api/admin/audit-logs` | `audit.read` | Lists audit trail entries filterable by `entityType` or `action`. |
