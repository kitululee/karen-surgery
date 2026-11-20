# Karen Surgery — Phase 2 Database Schema

**Schema Version:** `001_initial_schema`  
**Supported Engines:**
- **Production Recommended:** PostgreSQL 15+ (`server/migrations/001_initial_schema.postgres.sql`, activated via `DATABASE_URL`)
- **Zero-Dependency Local / Single-VM Option:** Node 22 built-in SQLite (`node:sqlite` `DatabaseSync`, `server/migrations/001_initial_schema.sqlite.sql`, activated when `DATABASE_URL` is unset via `SQLITE_PATH`)

Both dialects maintain strict 1:1 relational parity across all 17 core tables, foreign keys, `CHECK` constraints, and query indexes.

---

## 1. Authentication & Role-Based Access Control (RBAC)

| Table | Purpose | Key Columns & Constraints |
|---|---|---|
| `schema_migrations` | Idempotent migration ledger | `version` (PK), `applied_at` |
| `roles` | Fixed administrative role catalogue | `id`, `code` (UNIQUE: `SUPER_ADMIN`, `CONTENT_ADMIN`, `RECEPTION_OPERATIONS`, `READ_ONLY`), `name`, `description` |
| `permissions` | Fine-grained server-side capability codes (14 seeded) | `id`, `code` (UNIQUE, e.g. `appointments.write`, `settings.emergency`, `audit.read`), `description` |
| `role_permissions` | Many-to-many role-to-permission binding | Composite PK `(role_id, permission_id)`, cascading deletes |
| `admin_users` | Staff accounts (no hardcoded defaults) | `id`, `email` (UNIQUE), `full_name`, `password_hash` (Argon2id), `role_id` (FK -> `roles`), `is_active`, `last_login_at` |
| `admin_sessions` | Server-side session store (opaque cookie token hashed via SHA-256) | `id`, `user_id` (FK -> `admin_users`), `token_hash` (UNIQUE), `csrf_token`, `ip_address`, `user_agent`, `expires_at` |
| `password_reset_tokens` | Single-use 30-minute reset tokens (SHA-256 hashed) | `id`, `user_id` (FK -> `admin_users`), `token_hash` (UNIQUE), `expires_at`, `used_at` |

---

## 2. Content Management System (CMS) & Media

| Table | Purpose | Key Columns & Constraints |
|---|---|---|
| `media_assets` | Verified original practice assets + validated admin uploads | `id`, `asset_key` (UNIQUE), `filename`, `original_name`, `mime_type`, `size_bytes`, `width`, `height`, `alt_text`, `storage_path`, `public_url`, `is_system_asset`, `uploaded_by` |
| `pages` | Public pages metadata & publish lifecycle | `id`, `slug` (UNIQUE), `title`, `meta_title`, `meta_description`, `status` (`draft`, `published`, `archived`), `is_system_page`, `published_at` |
| `page_sections` | Structured sections per page | `id`, `page_id` (FK -> `pages`), `section_key`, `section_type`, `heading`, `subheading`, `body_json`, `cta_label`, `cta_href`, `media_asset_id` (FK -> `media_assets`), `sort_order`, `is_published`, UNIQUE `(page_id, section_key)` |
| `services` | Verified multidisciplinary service categories (6 seeded) | `id`, `slug` (UNIQUE), `title`, `short_title`, `icon`, `description`, `highlights_json`, `href`, `contact_email`, `media_asset_id`, `is_published`, `sort_order` |
| `practitioners` | Authoritative clinician & staff records (19 seeded from `karensurgery.com`) | `id`, `slug` (UNIQUE), `name`, `qualifications`, `role_title`, `department`, `department_label`, `department_href`, `quote`, `bio_json`, `bullet_heading`, `bullet_items_json`, `secondary_lists_json`, `specialties_json`, `email`, `phones_json`, `phone_prefix`, `website_json`, `instagram_json`, `media_asset_id`, `image_position`, `is_active`, `is_approved`, `is_archived`, `sort_order` |
| `practitioner_services` | Links each active clinician to one or more service categories | Composite PK `(practitioner_id, service_id)` |
| `website_settings` | Singleton (`id = 1`) site-wide structured configuration | `id` (`CHECK id = 1`), `opening_hours_json`, `contact_json`, `emergency_json`, `location_json`, `navigation_json`, `footer_json`, `chatbot_config_json`, `data_retention_days`, `updated_by` |

> **Deletion Protection:** Media assets referenced by `practitioners.media_asset_id`, `services.media_asset_id`, or `page_sections.media_asset_id` (as well as core `is_system_asset = 1` assets) are protected at the API layer (`HTTP 409 Conflict`) to prevent broken imagery.

---

## 3. Patient Operations (Appointments & Enquiries)

| Table | Purpose | Key Columns & Constraints |
|---|---|---|
| `appointment_requests` | Request-and-follow-up booking workflow (NOT auto-confirmed) | `id`, `reference_code` (UNIQUE `KS-APT-YYYYMMDD-XXXXXX`), `full_name`, `phone`, `email`, `patient_type` (`new`/`existing`), `service_slug`, `service_label`, `practitioner_id` (FK -> `practitioners` `ON DELETE SET NULL`), `practitioner_name`, `preferred_date`, `preferred_time`, `preferred_contact`, `message`, `privacy_accepted`, `status` (`new`, `under_review`, `assigned`, `awaiting_patient_response`, `confirmed`, `completed`, `cancelled`), `assigned_to_user_id`, `routed_email`, `email_status`, `internal_notes` (private staff-only), `confirmed_at`, `cancelled_at`, `completed_at` |
| `enquiries` | General inquiries from `/contact-us/` and explicitly approved chatbot drafts | `id`, `reference_code` (UNIQUE `KS-ENQ-YYYYMMDD-XXXXXX`), `full_name`, `email`, `phone`, `category`, `subject`, `message`, `preferred_contact`, `privacy_accepted`, `source` (`contact_form` \| `chatbot`), `original_question`, `conversation_summary`, `status` (`new`, `open`, `assigned`, `awaiting_response`, `resolved`, `archived`), `assigned_to_user_id`, `routed_email`, `email_status`, `internal_notes`, `follow_up_notes`, `resolved_at` |

---

## 4. Chatbot Knowledge & Governance

| Table | Purpose | Key Columns & Constraints |
|---|---|---|
| `chatbot_faqs` | Approved structured knowledge entries (15 verified Karen Surgery FAQs seeded) | `id`, `category`, `question`, `answer`, `keywords_json`, `suggested_followups_json`, `is_published`, `is_approved`, `sort_order`, `created_by`, `approved_by` |
| `chatbot_unanswered` | Queue of visitor questions that did not match approved knowledge | `id`, `question`, `detected_category`, `session_id`, `status` (`open`, `reviewed`, `converted`, `dismissed`), `converted_faq_id` (FK -> `chatbot_faqs`) |
| `chatbot_conversations` | Lightweight non-PII interaction metrics for assistant accuracy auditing | `id`, `session_id`, `question`, `response_type`, `matched_faq_id`, `escalated`, `created_at` |

---

## 5. Audit Logging & Indexes

| Table | Purpose | Key Columns |
|---|---|---|
| `audit_logs` | Immutable operational & security audit trail | `id`, `actor_user_id`, `actor_email`, `actor_role`, `action`, `entity_type`, `entity_id`, `summary`, `metadata_json`, `ip_address`, `created_at` |

### Indexes Created
- `idx_admin_sessions_expires` on `admin_sessions(expires_at)`
- `idx_practitioners_active` on `practitioners(is_active, is_approved, is_archived, department)`
- `idx_appointments_status_created` on `appointment_requests(status, created_at DESC)`
- `idx_appointments_practitioner` on `appointment_requests(practitioner_id)`
- `idx_enquiries_status_source` on `enquiries(status, source, created_at DESC)`
- `idx_chatbot_faqs_published` on `chatbot_faqs(is_published, is_approved, category)`
- `idx_chatbot_unanswered_status` on `chatbot_unanswered(status, created_at DESC)`
- `idx_audit_logs_created` on `audit_logs(created_at DESC)`
- `idx_audit_logs_entity` on `audit_logs(entity_type, entity_id)`

---

## 6. Running Migrations & Seeding

```bash
cd server
npm run migrate   # Applies 001_initial_schema idempotently
npm run seed      # Populates verified Karen Surgery data (idempotent — safe to re-run)
```
