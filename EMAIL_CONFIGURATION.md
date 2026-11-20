# Karen Surgery — Phase 2 Email Notification & Routing Configuration

## 1. Current Status

- **Email delivery code & routing logic:** **Implemented & Verified** (`server/src/services/email.ts`, Nodemailer).
- **Production SMTP credentials:** **Awaiting Credentials from Practice Administrator.**
- **Graceful unconfigured behaviour:** When `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` are omitted, appointment requests and enquiries are **still safely saved in the database** and visible immediately in the Administration Portal, with `email_status = "queued_unconfigured"`. No submissions are lost or blocked.

---

## 2. Verified Routing Priority Rules

### Appointment Requests (`POST /api/public/appointments`)
Resolved dynamically from the database in `resolveAppointmentRecipient()`:
1. **Approved practitioner email:** If the visitor selected an active, approved practitioner whose verified database record has a direct email address (e.g., Mental Health, Physiotherapy, or Allied Health specialists whose emails are published on `karensurgery.com`), the notification routes to that practitioner's verified email.
2. **Approved service email:** Otherwise, if the selected published service has a configured `contact_email`, it routes there.
3. **Default reception fallback:** `Receptionist@KarenSurgery.com` (configurable via `RECEPTION_EMAIL` env var).

> No practitioner email addresses were invented. Doctors and nursing staff who do not publish personal emails on `karensurgery.com` automatically route to `Receptionist@KarenSurgery.com`.

### General Enquiries & Chatbot-Prepared Enquiries (`POST /api/public/enquiries`)
- All routine enquiries (`source = "contact_form"` and `source = "chatbot"`) route to `Receptionist@KarenSurgery.com`.

### Admin Password Resets (`POST /api/auth/forgot-password`)
- Routes strictly to the requesting active `admin_users.email` address with a single-use 30-minute reset link pointing to `ADMIN_PORTAL_URL`.

---

## 3. Healthcare Privacy Minimisation Policy

To avoid exposing sensitive patient notes or staff commentary over ordinary email:
- Appointment notification emails contain **only**: Reference Code (`KS-APT-...`), Service Category, Preferred Practitioner, Preferred Date/Time, Preferred Contact Method, and a direct link to the protected Administration Portal.
- General enquiry emails contain **only**: Reference Code (`KS-ENQ-...`), Source (`Contact Form` vs. `Website Assistant`), Inquiry Category, Preferred Contact Method, and a direct link to the protected Administration Portal.
- Patient free-text messages and staff `internal_notes` remain strictly inside the authenticated database & Admin Portal.

---

## 4. Required Production Environment Variables (`/etc/karen-surgery/api.env`)

```dotenv
# Practice routing & portal links
RECEPTION_EMAIL=Receptionist@KarenSurgery.com
ADMIN_PORTAL_URL=https://admin.karensurgery.com

# SMTP Transport (Example: Microsoft 365 / Google Workspace / Postmark / Mailgun / Zoho)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@karensurgery.com
SMTP_PASS=<provide-app-password-or-smtp-key-on-vm>
SMTP_FROM="Karen Surgery Website <notifications@karensurgery.com>"
```

### DNS Deliverability Checklist (When Activating SMTP)
1. Publish an **SPF** TXT record authorizing your chosen SMTP provider on `karensurgery.com`.
2. Enable **DKIM** signing with your SMTP provider.
3. Configure a **DMARC** policy (start with `v=DMARC1; p=quarantine; rua=mailto:postmaster@karensurgery.com`).
4. Submit one test appointment request and verify `email_status = "sent"` inside the Administration Portal.
