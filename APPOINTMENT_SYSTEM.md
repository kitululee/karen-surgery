# Karen Surgery — Phase 2 Appointment Request System

## 1. Operational Model: Request & Follow-Up (Not Auto-Booking)

Karen Surgery's online appointment system is intentionally architected as a **request-and-follow-up workflow**, never an automatic real-time slot confirmation engine:
- Visitors submit their preferred service category, optional practitioner, preferred date/time window, and preferred contact method.
- The system validates inputs, applies spam/rate-limit protection, saves the request in the database with `status = "new"`, routes a privacy-minimised notification email, and displays a clear non-confirmed acknowledgement with a unique reference number (`KS-APT-YYYYMMDD-XXXXXX`).
- Authorised reception or clinical staff confirm availability directly with the patient and update the status in the Administration Portal.

---

## 2. Public Entry Points (UI/UX Preserved)

A single consistent native `<dialog>` modal (`src/components/AppointmentRequestModal.tsx`) is integrated unobtrusively across all 6 required existing pages without adding top-level navigation items or duplicate booking pages:

1. **Homepage (`/`):** `"Request Appointment"` pill in Band 6 (`Reception & Consulting Hours` card) — Hero Band 1 untouched.
2. **Doctors & Medical Staff (`/doctors/`):** `"Request Appointment"` in `PageHero` (pre-selecting `family-medicine`) plus discreet `"Request Appointment"` pills on every GP, Practice Nurse, and Consultant Radiologist card (pre-selecting that clinician).
3. **Mental Health (`/mental-health/`):** `"Request Appointment"` inside the `Referrals & Appointments` sidebar card (pre-selecting `mental-health`) plus each practitioner card.
4. **Physiotherapy (`/physiotherapy/`):** `"Request Appointment"` in `PageHero` (pre-selecting `physiotherapy`) plus each physiotherapist card.
5. **Allied Health (`/allied-health-professionals/`):** `"Request Appointment"` in `PageHero` (pre-selecting `allied-health`) plus each podiatrist, massage therapist, and nutritionist card.
6. **Contact Us (`/contact-us/`):** `"Request an Appointment"` action in the Reception Contact Channels header and inside the General Enquiry side card.

*(Note: Non-clinical support staff — Anne Ragui and Eunice Muthoni Mugo — are excluded from individual clinician booking options.)*

---

## 3. Dynamic Service & Practitioner Options

When connected to the Karen Surgery Backend API (`NEXT_PUBLIC_API_URL`), the modal dynamically loads `GET /api/public/booking-options`:
- Only **published** service categories (`is_published = 1`) plus `"Other verified services"` appear.
- Only **active, approved, non-archived** clinical practitioners (`is_active = 1 AND is_approved = 1 AND is_archived = 0 AND department != 'support'`) appear.
- Selecting a service category automatically filters the Preferred Practitioner dropdown to clinicians linked to that service via `practitioner_services`.
- Selecting a practitioner from any practitioner card pre-selects both their service category and their name in the modal.

*(On static GitHub Pages preview when `NEXT_PUBLIC_API_URL` is blank, verified options populate from the synchronized static source data and submission prepares instant pre-filled Email & WhatsApp links for reception while clearly noting preview mode.)*

---

## 4. Form Fields, Validation & Spam Protection

- **Required fields:** Full Name, Telephone Number, Email Address, Patient Status (`new` / `existing`), Service Category, Preferred Date (today or future), Privacy Acknowledgement checkbox.
- **Optional fields:** Preferred Practitioner, Preferred Time Window, Preferred Contact Method (`phone` / `whatsapp` / `email`), Brief Optional Note (max 600 characters, paired with a privacy reminder not to enter sensitive clinical histories).
- **Emergency reminder banner:** Prominently reminds visitors at the top of the modal not to use online requests for emergencies, linking directly to `+254 (0) 724 840246`.
- **Anti-spam controls:** Hidden honeypot field (`websiteUrl`), minimum completion time check (`startedAt`), and backend IP rate limiting (`8 requests / 10 minutes`).

---

## 5. Lifecycle Statuses & Routing

### Allowed Statuses (Managed in Admin Portal)
1. `new` — Freshly submitted request awaiting initial review.
2. `under_review` — Reception or practitioner is checking slot availability.
3. `assigned` — Assigned to a specific staff member (`assigned_to_user_id`).
4. `awaiting_patient_response` — Staff contacted patient with proposed times; awaiting reply.
5. `confirmed` — Staff confirmed appointment with patient (records `confirmed_at`).
6. `completed` — Consultation completed (records `completed_at`).
7. `cancelled` — Cancelled by patient or clinic (records `cancelled_at`).

### Notification Routing Order
1. Approved practitioner's verified email (if selected and present in `practitioners.email`)
2. Approved service's `contact_email`
3. Default Reception fallback (`Receptionist@KarenSurgery.com`)

Staff `internal_notes` are strictly private inside the Administration Portal and are never included in emails or public responses.
