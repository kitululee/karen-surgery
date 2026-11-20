-- Karen Surgery Phase 2 Initial Schema (SQLite)

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_key TEXT UNIQUE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt_text TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_system_asset INTEGER NOT NULL DEFAULT 0,
  uploaded_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_system_page INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'text',
  heading TEXT NOT NULL DEFAULT '',
  subheading TEXT NOT NULL DEFAULT '',
  body_json TEXT NOT NULL DEFAULT '{}',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '',
  media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (page_id, section_key)
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'stethoscope',
  description TEXT NOT NULL DEFAULT '',
  highlights_json TEXT NOT NULL DEFAULT '[]',
  href TEXT NOT NULL DEFAULT '',
  contact_email TEXT,
  media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS practitioners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  qualifications TEXT NOT NULL DEFAULT '',
  role_title TEXT NOT NULL,
  department TEXT NOT NULL,
  department_label TEXT NOT NULL,
  department_href TEXT NOT NULL,
  quote TEXT NOT NULL DEFAULT '',
  bio_json TEXT NOT NULL DEFAULT '[]',
  bullet_heading TEXT NOT NULL DEFAULT '',
  bullet_items_json TEXT NOT NULL DEFAULT '[]',
  secondary_lists_json TEXT NOT NULL DEFAULT '[]',
  specialties_json TEXT NOT NULL DEFAULT '[]',
  email TEXT,
  phones_json TEXT NOT NULL DEFAULT '[]',
  phone_prefix TEXT NOT NULL DEFAULT '',
  website_json TEXT,
  instagram_json TEXT,
  media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
  image_position TEXT NOT NULL DEFAULT '50% 25%',
  is_active INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 1,
  is_archived INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS practitioner_services (
  practitioner_id INTEGER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (practitioner_id, service_id)
);

CREATE TABLE IF NOT EXISTS appointment_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  patient_type TEXT NOT NULL DEFAULT 'new' CHECK (patient_type IN ('new', 'existing')),
  service_slug TEXT NOT NULL,
  service_label TEXT NOT NULL,
  practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  practitioner_name TEXT,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL DEFAULT '',
  preferred_contact TEXT NOT NULL DEFAULT 'phone',
  message TEXT NOT NULL DEFAULT '',
  privacy_accepted INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'under_review', 'assigned', 'awaiting_patient_response', 'confirmed', 'completed', 'cancelled')
  ),
  assigned_to_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  routed_email TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'queued_unconfigured',
  internal_notes TEXT NOT NULL DEFAULT '',
  confirmed_at TEXT,
  cancelled_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  preferred_contact TEXT NOT NULL DEFAULT 'email',
  privacy_accepted INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'contact_form' CHECK (source IN ('contact_form', 'chatbot')),
  original_question TEXT NOT NULL DEFAULT '',
  conversation_summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'open', 'assigned', 'awaiting_response', 'resolved', 'archived')
  ),
  assigned_to_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  routed_email TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'queued_unconfigured',
  internal_notes TEXT NOT NULL DEFAULT '',
  follow_up_notes TEXT NOT NULL DEFAULT '',
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords_json TEXT NOT NULL DEFAULT '[]',
  suggested_followups_json TEXT NOT NULL DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chatbot_unanswered (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  detected_category TEXT NOT NULL DEFAULT 'General enquiries',
  session_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'converted', 'dismissed')),
  converted_faq_id INTEGER REFERENCES chatbot_faqs(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  response_type TEXT NOT NULL,
  matched_faq_id INTEGER REFERENCES chatbot_faqs(id) ON DELETE SET NULL,
  escalated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS website_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  opening_hours_json TEXT NOT NULL DEFAULT '{}',
  contact_json TEXT NOT NULL DEFAULT '{}',
  emergency_json TEXT NOT NULL DEFAULT '{}',
  location_json TEXT NOT NULL DEFAULT '{}',
  navigation_json TEXT NOT NULL DEFAULT '[]',
  footer_json TEXT NOT NULL DEFAULT '{}',
  chatbot_config_json TEXT NOT NULL DEFAULT '{}',
  data_retention_days INTEGER NOT NULL DEFAULT 365,
  updated_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for operational performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_practitioners_active ON practitioners(is_active, is_approved, is_archived, department);
CREATE INDEX IF NOT EXISTS idx_appointments_status_created ON appointment_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON appointment_requests(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status_source ON enquiries(status, source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_published ON chatbot_faqs(is_published, is_approved, category);
CREATE INDEX IF NOT EXISTS idx_chatbot_unanswered_status ON chatbot_unanswered(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
