# Karen Surgery — Administration Portal Operational Guide

## 1. Architecture & Isolation

The Karen Surgery Administration Portal (`admin/`) is a **completely independent React + Vite + TypeScript application** deployed on its own administrative hostname (`https://admin.karensurgery.com`).
- It is **never linked** from the public Karen Surgery website navigation or footer.
- Search engine indexing is blocked via `X-Robots-Tag: noindex, nofollow, noarchive` and `robots.txt` (`Disallow: /`).
- Authentication uses real server-side sessions (`HttpOnly`, `SameSite=Lax`, `Secure` cookie `ks_admin_session`) paired with per-session `X-CSRF-Token` headers. No credentials or tokens are ever stored in `localStorage`.

---

## 2. Initial Super Administrator Provisioning

Zero default passwords exist in the codebase. On first deployment (or local full-stack testing), create the initial `SUPER_ADMIN` account via the secure CLI script:

```bash
cd server
npm run migrate
npm run seed
# Interactive prompt (recommended so password never enters shell history):
npm run create-admin

# Or automated via environment variables:
ADMIN_EMAIL="admin@karensurgery.com" \
ADMIN_NAME="Practice Administrator" \
ADMIN_PASSWORD="<strong-12-plus-char-password>" \
npm run create-admin
```

*(You may omit `--password` to be prompted interactively without echoing the password to terminal history.)*

---

## 3. Roles & Permissions (Server-Side RBAC)

| Role | Operational Capabilities |
|---|---|
| **`SUPER_ADMIN`** | Full access: Dashboard, Appointments, Enquiries, CMS Pages/Sections, Practitioners, Services, Media Library, Chatbot Knowledge, Settings, **Emergency Contact Updates** (with double confirmation), User & Role Management, and Audit Logs. |
| **`CONTENT_ADMIN`** | Dashboard, CMS Pages & Sections, Practitioners, Services, Media Library, Chatbot Knowledge/Unanswered Queue, and Routine Website Settings (opening hours, routine contact, navigation, footer). Cannot modify Emergency Contacts, Users, Audit Logs, or patient Appointments/Enquiries. |
| **`RECEPTION_OPERATIONS`** | Dashboard, Appointments (view, filter, assign, update status, add internal notes), Enquiries (view, filter including Chatbot source, assign, update status, internal & follow-up notes), and read-only Chatbot overview. Cannot edit CMS, Users, or Emergency Settings. |
| **`READ_ONLY`** | Read-only access to Dashboard, Appointments, Enquiries, CMS, and Chatbot records. All mutating actions are rejected server-side with `403 Forbidden`. |

---

## 4. Portal Modules Walkthrough

1. **Dashboard:** Live database metrics (Pending Appointments, Open Enquiries, Chatbot-Sourced Enquiries, Active Practitioners, Published Pages, Published FAQs, Open Unanswered Questions) plus a real-time Recent Activity stream.
2. **Appointments:** Search by reference code/patient/practitioner, filter by lifecycle status (`new` through `completed`/`cancelled`), assign to staff, inspect email routing status, update lifecycle state, and save private `internal_notes`.
3. **Enquiries:** Filter by status or origin (`Contact Form` vs. **`Chatbot`** badge), view original visitor question and chatbot conversation summary where applicable, assign staff, maintain internal & follow-up notes, and resolve/archive enquiries.
4. **Content CMS:**
   - **Pages & Sections:** Manage all 13 website pages, edit SEO metadata, switch `draft` / `published` / `archived` status, and edit structured sections.
   - **Practitioners:** Add/edit/archive clinicians, toggle `Active` and `Approved` status (controls dynamic appointment modal & chatbot visibility), manage direct verified emails and linked services.
   - **Services:** Edit service descriptions, highlights, publish status, and service routing emails.
   - **Media Library:** Inspect all 24 verified practice photos, upload new JPEG/PNG/WebP/AVIF images (magic-byte validated, max 5 MB), update alt text, and safely delete unused non-system uploads (in-use assets are protected against accidental deletion).
5. **Chatbot Knowledge:** Manage published/approved FAQs, add new practice Q&As with keywords, review the **Unanswered Questions Queue**, and convert unanswered questions directly into approved FAQs with one workflow.
6. **Settings, Emergency Safeguard, Users & Audit Logs:**
   - Edit opening hours, routine reception contacts, location metadata, navigation/footer config, chatbot toggle/welcome message, and data retention days.
   - **Emergency Contacts (`SUPER_ADMIN` only):** Requires typing `"CONFIRM EMERGENCY CHANGE"` verbatim before saving any update to emergency numbers or banners.
   - **Users & Roles (`SUPER_ADMIN` only):** Create staff accounts, assign/change roles, deactivate accounts (immediately invalidates active sessions), or reset passwords.
   - **Audit Logs (`SUPER_ADMIN` only):** Filterable ledger of logins, logouts, appointment/enquiry updates, CMS edits, emergency changes, and user management actions.
