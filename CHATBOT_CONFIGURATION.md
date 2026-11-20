# Karen Surgery — Phase 2 Chatbot Configuration & Safety Guide

## 1. Architecture Overview (Zero Paid AI Dependencies)

The Karen Surgery Practice Assistant (`src/components/PracticeChatbot.tsx` + `server/src/services/chatbot.ts`) is a **deterministic, retrieval-based assistant** requiring **zero paid LLM or third-party AI API keys**. Every answer is strictly grounded in verified Karen Surgery content stored in the database (`chatbot_faqs`, `practitioners`, `website_settings`) — with a synchronized static preview mirror on GitHub Pages when no backend API URL is configured.

### Design & UX Integration
- Mounted via a discreet floating launcher pill (`Practice Assistant`, `fixed bottom-5 right-5 z-40`) that does not obstruct navigation, heroes, or mobile controls.
- Compact, collapsible panel styled in Karen Surgery's approved `#121713` / `#2F4A2C` / `#F6F7F5` palette.
- **Strictly optional:** Visitors can always browse services, request appointments, or contact reception without ever opening the chatbot.

---

## 2. Multi-Layer Clinical Safety & Guardrails

Every incoming question passes through an ordered 5-stage pipeline:

1. **Emergency Guardrail (Highest Priority):**
   - Matches urgent red-flag terms (e.g., `chest pain`, `heart attack`, `stroke`, `cannot breathe`, `severe bleeding`, `unconscious`, `seizure`, `choking`, `overdose`, `suicidal`, `trauma`, `need an ambulance`).
   - Immediately displays the high-contrast **Emergency Notice** with clickable call button for Karen Surgery Emergencies Only (`+254 (0) 724 840246`, daylight 7:00 am – 7:00 pm, 365 days), the verified no-night-calls policy, and all verified Nairobi ambulance numbers (Karen Hospital, Red Cross E-Plus, AAR, AMREF, St. John's). **Never attempts medical triage.**
2. **Clinical / Medical Advice Refusal:**
   - Matches diagnosis, prescription, dosage, symptom-checking, or lab-result interpretation requests.
   - Politely declines medical advice and directs the visitor to speak with a Karen Surgery clinician or request an appointment.
3. **Live Active Practitioner Lookup:**
   - Matches active, approved, non-archived practitioners by surname/name from the `practitioners` table (returns verified role, qualifications, opening paragraph, and verified contact pathway).
4. **Approved FAQ Retrieval (Word-Boundary Scored):**
   - Out-of-scope clinical facilities not offered at Karen Surgery (e.g., MRI, CT scan, X-ray, dental, inpatient ward, pharmacy) are explicitly prevented from false keyword matches.
   - Scores active, published, **approved** entries in `chatbot_faqs` using word-boundary keyword & token matching (`score >= 3`).
   - 15 verified Karen Surgery FAQs are pre-seeded covering: Opening Hours, Location & Directions, Appointments, Emergency & After Hours, Fees & Insurance, Services Overview, Doctors & Practice Nurse, Ultrasound Services, Mental Health, Physiotherapy, Allied Health, Laboratory Services, Vaccinations, House Visits & Prescriptions, and Reception Contact.
5. **Out-of-Scope Fallback & Automatic Reviewable Enquiry Draft:**
   - If no verified answer matches, the assistant states honestly that it does not have verified information and **never invents facts**.
   - Logs the question in `chatbot_unanswered` for administrator review.
   - Offers a **"Review & Prepare Enquiry for Reception"** button that opens an inline **editable draft form** pre-populated with:
     - Original visitor question
     - Auto-detected inquiry category (editable across all 9 verified categories)
     - Suggested subject (editable)
     - Conversation summary (editable)
     - Visitor contact fields (Name*, Email*, Phone optional, Preferred contact) and Privacy acknowledgement*.
   - **Nothing is submitted automatically.** Only when the visitor explicitly clicks **Send Enquiry** is the record saved to `enquiries` with `source = "chatbot"` and routed to Karen Surgery reception.

---

## 3. Managing the Chatbot in the Administration Portal

Administrators with `SUPER_ADMIN` or `CONTENT_ADMIN` roles can manage the assistant in **Chatbot Knowledge** and **Settings & Users**:
- **Enable / Disable Widget:** Toggle chatbot visibility globally without redeploying code (`website_settings.chatbot_config_json.enabled`).
- **Welcome Message & Suggested Questions:** Update the greeting text and quick-start suggestion pills.
- **Escalation Contacts:** Synchronised with verified reception phone, WhatsApp, email, and emergency contacts.
- **FAQ Management:** Add, edit, approve/unapprove, publish/unpublish, or delete structured FAQ entries. Only entries with both `is_published = 1` AND `is_approved = 1` are served to visitors.
- **Unanswered Questions Queue:** Review logged visitor questions, mark as reviewed/dismissed, or click **Convert to FAQ** to turn common real visitor questions into approved published knowledge.
