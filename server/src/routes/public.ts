import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { getDb, nowIso } from "../db/database.js";
import {
  notifyAppointmentRequest,
  notifyGeneralEnquiry,
  resolveAppointmentRecipient,
} from "../services/email.js";
import { answerChatbotQuestion, getPublicChatbotConfig } from "../services/chatbot.js";

function generateReference(prefix: "APT" | "ENQ"): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `KS-${prefix}-${datePart}-${rand}`;
}

const appointmentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  phone: z.string().trim().min(7, "Telephone number is required.").max(40),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  patientType: z.enum(["new", "existing"]).default("new"),
  serviceSlug: z.string().trim().min(1, "Please choose a service category.").max(80),
  practitionerId: z.number().int().positive().nullable().optional(),
  preferredDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Preferred date must be YYYY-MM-DD."),
  preferredTime: z.string().trim().max(80).optional().default(""),
  preferredContact: z.enum(["phone", "whatsapp", "email"]).default("phone"),
  message: z.string().trim().max(600, "Please keep optional notes brief (under 600 characters).").optional().default(""),
  privacyAccepted: z.literal(true, { errorMap: () => ({ message: "Please confirm the privacy acknowledgement." }) }),
  // Spam honeypot (must stay empty)
  websiteUrl: z.string().max(200).optional().default(""),
  startedAt: z.number().optional(),
});

const INQUIRY_CATEGORIES = [
  "General enquiries",
  "General Practice",
  "Mental Health",
  "Physiotherapy",
  "Allied Health",
  "Laboratory Services",
  "Other verified services",
  "Appointment enquiries",
  "Other",
] as const;

const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().email("Valid email address is required.").max(160),
  phone: z.string().trim().max(40).optional().default(""),
  category: z.enum(INQUIRY_CATEGORIES),
  subject: z.string().trim().min(3, "Subject is required.").max(160),
  message: z.string().trim().min(8, "Please include your message.").max(2000),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).default("email"),
  privacyAccepted: z.literal(true, { errorMap: () => ({ message: "Please confirm the privacy acknowledgement." }) }),
  source: z.enum(["contact_form", "chatbot"]).optional().default("contact_form"),
  originalQuestion: z.string().trim().max(500).optional().default(""),
  conversationSummary: z.string().trim().max(800).optional().default(""),
  websiteUrl: z.string().max(200).optional().default(""),
  startedAt: z.number().optional(),
});

const chatbotAskSchema = z.object({
  question: z.string().trim().min(2).max(500),
  sessionId: z.string().trim().max(64).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
    .max(12)
    .optional(),
});

export async function publicRoutes(app: FastifyInstance) {
  app.get("/api/public/health", async () => {
    const db = getDb();
    await db.get("SELECT 1 as ok");
    return { status: "ok", db: db.kind, timestamp: nowIso() };
  });

  // Dynamic active/approved booking options (strictly published services + active approved practitioners)
  app.get("/api/public/booking-options", async () => {
    const db = getDb();
    const services = await db.all<{
      id: number;
      slug: string;
      title: string;
      short_title: string;
      href: string;
    }>(
      "SELECT id, slug, title, short_title, href FROM services WHERE is_published = 1 ORDER BY sort_order ASC, id ASC"
    );

    const practitioners = await db.all<{
      id: number;
      slug: string;
      name: string;
      role_title: string;
      qualifications: string;
      department: string;
      department_label: string;
      has_direct_email: number;
    }>(
      `SELECT id, slug, name, role_title, qualifications, department, department_label,
              CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END AS has_direct_email
       FROM practitioners
       WHERE is_active = 1 AND is_approved = 1 AND is_archived = 0 AND department != 'support'
       ORDER BY sort_order ASC, id ASC`
    );

    const links = await db.all<{ practitioner_id: number; service_id: number }>(
      "SELECT practitioner_id, service_id FROM practitioner_services"
    );
    const serviceSlugById = new Map(services.map((s) => [s.id, s.slug]));
    const pracServiceSlugs = new Map<number, string[]>();
    for (const l of links) {
      const slug = serviceSlugById.get(l.service_id);
      if (!slug) continue;
      const arr = pracServiceSlugs.get(l.practitioner_id) || [];
      arr.push(slug);
      pracServiceSlugs.set(l.practitioner_id, arr);
    }

    return {
      services: [
        ...services.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          shortTitle: s.short_title,
        })),
        { id: 0, slug: "other-verified-services", title: "Other verified services", shortTitle: "Other Services" },
      ],
      practitioners: practitioners.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        role: p.role_title,
        qualifications: p.qualifications,
        department: p.department,
        departmentLabel: p.department_label,
        serviceSlugs: pracServiceSlugs.get(p.id) || [],
      })),
    };
  });

  // Public published practice settings
  app.get("/api/public/settings", async () => {
    const db = getDb();
    const row = await db.get<{
      opening_hours_json: string;
      contact_json: string;
      emergency_json: string;
      location_json: string;
      navigation_json: string;
      footer_json: string;
      chatbot_config_json: string;
    }>("SELECT * FROM website_settings WHERE id = 1");

    if (!row) return {};
    return {
      openingHours: JSON.parse(row.opening_hours_json),
      contact: JSON.parse(row.contact_json),
      emergency: JSON.parse(row.emergency_json),
      location: JSON.parse(row.location_json),
      navigation: JSON.parse(row.navigation_json),
      footer: JSON.parse(row.footer_json),
      chatbot: JSON.parse(row.chatbot_config_json),
    };
  });

  // Public published page content only (never returns drafts or archived)
  app.get<{ Params: { slug: string } }>("/api/public/pages/:slug", async (req, reply) => {
    const db = getDb();
    const page = await db.get<{
      id: number;
      slug: string;
      title: string;
      meta_title: string;
      meta_description: string;
      published_at: string | null;
    }>(
      "SELECT id, slug, title, meta_title, meta_description, published_at FROM pages WHERE slug = $1 AND status = 'published'",
      [req.params.slug]
    );
    if (!page) return reply.code(404).send({ error: "Page not found." });

    const sections = await db.all(
      `SELECT ps.section_key, ps.section_type, ps.heading, ps.subheading, ps.body_json, ps.cta_label, ps.cta_href, ps.sort_order,
              m.public_url AS media_url, m.alt_text AS media_alt
       FROM page_sections ps
       LEFT JOIN media_assets m ON m.id = ps.media_asset_id
       WHERE ps.page_id = $1 AND ps.is_published = 1
       ORDER BY ps.sort_order ASC, ps.id ASC`,
      [page.id]
    );
    return { page, sections };
  });

  // Submit Appointment Request (NOT an automatic confirmed booking)
  app.post(
    "/api/public/appointments",
    {
      config: { rateLimit: { max: 8, timeWindow: "10 minutes" } },
    },
    async (req, reply) => {
      const parsed = appointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Please check the highlighted appointment form fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }
      const data = parsed.data;

      // Honeypot spam rejection (silent success-like rejection or 400)
      if (data.websiteUrl && data.websiteUrl.trim().length > 0) {
        return reply.code(400).send({ error: "Invalid submission detected." });
      }
      if (typeof data.startedAt === "number" && Date.now() - data.startedAt < 800) {
        return reply.code(429).send({ error: "Submission was too fast. Please review and try again." });
      }

      const db = getDb();

      // Verify service exists (or is "other-verified-services")
      let serviceLabel = "Other verified services";
      if (data.serviceSlug !== "other-verified-services") {
        const svc = await db.get<{ title: string }>(
          "SELECT title FROM services WHERE slug = $1 AND is_published = 1",
          [data.serviceSlug]
        );
        if (!svc) {
          return reply.code(400).send({ error: "Selected service category is not available." });
        }
        serviceLabel = svc.title;
      }

      // Verify practitioner if selected (must be active, approved, non-archived)
      let practitionerId: number | null = null;
      let practitionerName: string | null = null;
      if (data.practitionerId) {
        const prac = await db.get<{ id: number; name: string }>(
          "SELECT id, name FROM practitioners WHERE id = $1 AND is_active = 1 AND is_approved = 1 AND is_archived = 0",
          [data.practitionerId]
        );
        if (!prac) {
          return reply.code(400).send({ error: "Selected practitioner is not currently available." });
        }
        practitionerId = prac.id;
        practitionerName = prac.name;
      }

      const routedEmail = await resolveAppointmentRecipient(data.serviceSlug, practitionerId, db);
      const referenceCode = generateReference("APT");
      const ts = nowIso();

      const emailRes = await notifyAppointmentRequest({
        to: routedEmail,
        referenceCode,
        serviceLabel,
        practitionerName,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        preferredContact: data.preferredContact,
      });

      await db.run(
        `INSERT INTO appointment_requests (
          reference_code, full_name, phone, email, patient_type,
          service_slug, service_label, practitioner_id, practitioner_name,
          preferred_date, preferred_time, preferred_contact, message,
          privacy_accepted, status, routed_email, email_status, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,1,'new',$14,$15,$16,$16)`,
        [
          referenceCode,
          data.fullName,
          data.phone,
          data.email,
          data.patientType,
          data.serviceSlug,
          serviceLabel,
          practitionerId,
          practitionerName,
          data.preferredDate,
          data.preferredTime,
          data.preferredContact,
          data.message,
          routedEmail,
          emailRes.status,
          ts,
        ]
      );

      return reply.code(201).send({
        referenceCode,
        status: "new",
        serviceLabel,
        practitionerName,
        routedTo: routedEmail === config.receptionEmail ? "Karen Surgery Reception" : `${practitionerName || serviceLabel} / Reception`,
        acknowledgement:
          "Your appointment request has been received. Please note this is not yet a confirmed booking — our reception team or practitioner will contact you to confirm availability.",
      });
    }
  );

  // Submit General Enquiry (from Contact Us page OR explicitly approved Chatbot draft)
  app.post(
    "/api/public/enquiries",
    {
      config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
    },
    async (req, reply) => {
      const parsed = enquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Please review the highlighted enquiry fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }
      const data = parsed.data;

      if (data.websiteUrl && data.websiteUrl.trim().length > 0) {
        return reply.code(400).send({ error: "Invalid submission detected." });
      }
      if (typeof data.startedAt === "number" && Date.now() - data.startedAt < 800) {
        return reply.code(429).send({ error: "Submission was too fast. Please review and try again." });
      }

      const db = getDb();
      const referenceCode = generateReference("ENQ");
      const routedEmail = config.receptionEmail;
      const ts = nowIso();

      const emailRes = await notifyGeneralEnquiry({
        to: routedEmail,
        referenceCode,
        category: data.category,
        source: data.source,
        preferredContact: data.preferredContact,
      });

      await db.run(
        `INSERT INTO enquiries (
          reference_code, full_name, email, phone, category, subject, message,
          preferred_contact, privacy_accepted, source, original_question, conversation_summary,
          status, routed_email, email_status, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$10,$11,'new',$12,$13,$14,$14)`,
        [
          referenceCode,
          data.fullName,
          data.email,
          data.phone,
          data.category,
          data.subject,
          data.message,
          data.preferredContact,
          data.source,
          data.originalQuestion,
          data.conversationSummary,
          routedEmail,
          emailRes.status,
          ts,
        ]
      );

      return reply.code(201).send({
        referenceCode,
        status: "new",
        source: data.source,
        acknowledgement:
          "Thank you. Your enquiry has been sent to Karen Surgery reception and logged under reference " +
          referenceCode +
          ". Our team will respond via your preferred contact method during opening hours.",
      });
    }
  );

  // Chatbot Public Config & Retrieval Endpoint
  app.get("/api/public/chatbot/config", async () => {
    return getPublicChatbotConfig();
  });

  app.post(
    "/api/public/chatbot/ask",
    {
      config: { rateLimit: { max: 30, timeWindow: "5 minutes" } },
    },
    async (req, reply) => {
      const parsed = chatbotAskSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Please enter a question." });
      }
      const response = await answerChatbotQuestion({
        question: parsed.data.question,
        sessionId: parsed.data.sessionId,
        history: parsed.data.history,
      });
      return reply.send(response);
    }
  );
}
