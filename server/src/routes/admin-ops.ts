import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getDb, nowIso } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.js";

const updateAppointmentSchema = z.object({
  status: z
    .enum([
      "new",
      "under_review",
      "assigned",
      "awaiting_patient_response",
      "confirmed",
      "completed",
      "cancelled",
    ])
    .optional(),
  assignedToUserId: z.number().int().positive().nullable().optional(),
  internalNotes: z.string().max(4000).optional(),
});

const updateEnquirySchema = z.object({
  status: z
    .enum(["new", "open", "assigned", "awaiting_response", "resolved", "archived"])
    .optional(),
  assignedToUserId: z.number().int().positive().nullable().optional(),
  internalNotes: z.string().max(4000).optional(),
  followUpNotes: z.string().max(4000).optional(),
});

export async function adminOpsRoutes(app: FastifyInstance) {
  // Real DB-derived dashboard metrics — zero mock statistics
  app.get("/api/admin/dashboard", { preHandler: requireAuth("dashboard.read") }, async (req) => {
    const db = getDb();
    const canSeeAppointments = req.admin!.permissions.includes("appointments.read");
    const canSeeEnquiries = req.admin!.permissions.includes("enquiries.read");
    const canSeeAudit = req.admin!.permissions.includes("audit.read");

    const countVal = async (sql: string, params: (string | number)[] = []) => {
      const row = await db.get<{ c: number }>(sql, params);
      return Number(row?.c ?? 0);
    };

    const appointments = canSeeAppointments
      ? {
          total: await countVal("SELECT COUNT(*) as c FROM appointment_requests"),
          pending: await countVal(
            "SELECT COUNT(*) as c FROM appointment_requests WHERE status IN ('new', 'under_review', 'assigned', 'awaiting_patient_response')"
          ),
          confirmed: await countVal("SELECT COUNT(*) as c FROM appointment_requests WHERE status = 'confirmed'"),
          completed: await countVal("SELECT COUNT(*) as c FROM appointment_requests WHERE status = 'completed'"),
          cancelled: await countVal("SELECT COUNT(*) as c FROM appointment_requests WHERE status = 'cancelled'"),
        }
      : null;

    const enquiries = canSeeEnquiries
      ? {
          total: await countVal("SELECT COUNT(*) as c FROM enquiries"),
          newCount: await countVal("SELECT COUNT(*) as c FROM enquiries WHERE status = 'new'"),
          unresolved: await countVal(
            "SELECT COUNT(*) as c FROM enquiries WHERE status IN ('new', 'open', 'assigned', 'awaiting_response')"
          ),
          fromChatbot: await countVal("SELECT COUNT(*) as c FROM enquiries WHERE source = 'chatbot'"),
        }
      : null;

    const content = {
      publishedPages: await countVal("SELECT COUNT(*) as c FROM pages WHERE status = 'published'"),
      activePractitioners: await countVal(
        "SELECT COUNT(*) as c FROM practitioners WHERE is_active = 1 AND is_approved = 1 AND is_archived = 0"
      ),
      activeServices: await countVal("SELECT COUNT(*) as c FROM services WHERE is_published = 1"),
      publishedFaqs: await countVal("SELECT COUNT(*) as c FROM chatbot_faqs WHERE is_published = 1 AND is_approved = 1"),
      openUnanswered: await countVal("SELECT COUNT(*) as c FROM chatbot_unanswered WHERE status = 'open'"),
    };

    const recentActivity = canSeeAudit
      ? await db.all(
          `SELECT id, actor_email, actor_role, action, entity_type, entity_id, summary, created_at
           FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 12`
        )
      : await db.all(
          `SELECT id, actor_email, actor_role, action, entity_type, entity_id, summary, created_at
           FROM audit_logs WHERE actor_user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 10`,
          [req.admin!.userId]
        );

    return { appointments, enquiries, content, recentActivity };
  });

  // Active staff list for assignment dropdowns
  app.get("/api/admin/staff-options", { preHandler: requireAuth("dashboard.read") }, async () => {
    const db = getDb();
    return db.all(
      `SELECT u.id, u.full_name, u.email, r.code AS role_code
       FROM admin_users u JOIN roles r ON r.id = u.role_id
       WHERE u.is_active = 1 ORDER BY u.full_name ASC`
    );
  });

  // === APPOINTMENTS ===
  app.get<{ Querystring: { status?: string; service?: string; search?: string } }>(
    "/api/admin/appointments",
    { preHandler: requireAuth("appointments.read") },
    async (req) => {
      const db = getDb();
      const where: string[] = [];
      const params: (string | number)[] = [];

      if (req.query.status && req.query.status !== "all") {
        params.push(req.query.status);
        where.push(`a.status = $${params.length}`);
      }
      if (req.query.service && req.query.service !== "all") {
        params.push(req.query.service);
        where.push(`a.service_slug = $${params.length}`);
      }
      if (req.query.search && req.query.search.trim()) {
        const term = `%${req.query.search.trim().toLowerCase()}%`;
        params.push(term, term, term, term);
        const i = params.length - 3;
        where.push(
          `(LOWER(a.reference_code) LIKE $${i} OR LOWER(a.full_name) LIKE $${i + 1} OR LOWER(a.email) LIKE $${i + 2} OR LOWER(COALESCE(a.practitioner_name,'')) LIKE $${i + 3})`
        );
      }

      const sql = `
        SELECT a.*, u.full_name AS assigned_staff_name
        FROM appointment_requests a
        LEFT JOIN admin_users u ON u.id = a.assigned_to_user_id
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT 200`;

      return db.all(sql, params);
    }
  );

  app.patch<{ Params: { id: string } }>(
    "/api/admin/appointments/:id",
    { preHandler: requireAuth("appointments.write") },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ error: "Invalid appointment ID." });

      const parsed = updateAppointmentSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid update payload." });

      const db = getDb();
      const existing = await db.get<{
        id: number;
        reference_code: string;
        status: string;
        assigned_to_user_id: number | null;
        internal_notes: string;
      }>("SELECT id, reference_code, status, assigned_to_user_id, internal_notes FROM appointment_requests WHERE id = $1", [id]);

      if (!existing) return reply.code(404).send({ error: "Appointment request not found." });

      const nextStatus = parsed.data.status ?? existing.status;
      const nextAssignee =
        parsed.data.assignedToUserId !== undefined ? parsed.data.assignedToUserId : existing.assigned_to_user_id;
      const nextNotes =
        parsed.data.internalNotes !== undefined ? parsed.data.internalNotes : existing.internal_notes;
      const ts = nowIso();

      const confirmedAt = nextStatus === "confirmed" ? ts : null;
      const cancelledAt = nextStatus === "cancelled" ? ts : null;
      const completedAt = nextStatus === "completed" ? ts : null;

      await db.run(
        `UPDATE appointment_requests
         SET status = $1,
             assigned_to_user_id = $2,
             internal_notes = $3,
             confirmed_at = COALESCE($4, confirmed_at),
             cancelled_at = COALESCE($5, cancelled_at),
             completed_at = COALESCE($6, completed_at),
             updated_at = $7
         WHERE id = $8`,
        [nextStatus, nextAssignee, nextNotes, confirmedAt, cancelledAt, completedAt, ts, id]
      );

      await writeAuditLog({
        actorUserId: req.admin!.userId,
        actorEmail: req.admin!.email,
        actorRole: req.admin!.roleCode,
        action: "appointment.update",
        entityType: "appointment_request",
        entityId: existing.reference_code,
        summary: `Updated appointment ${existing.reference_code}: status=${nextStatus}`,
        metadata: { previousStatus: existing.status, newStatus: nextStatus, assignedToUserId: nextAssignee },
        ipAddress: req.ip,
      });

      const updated = await db.get(
        `SELECT a.*, u.full_name AS assigned_staff_name
         FROM appointment_requests a LEFT JOIN admin_users u ON u.id = a.assigned_to_user_id
         WHERE a.id = $1`,
        [id]
      );
      return reply.send(updated);
    }
  );

  // === ENQUIRIES ===
  app.get<{ Querystring: { status?: string; source?: string; search?: string } }>(
    "/api/admin/enquiries",
    { preHandler: requireAuth("enquiries.read") },
    async (req) => {
      const db = getDb();
      const where: string[] = [];
      const params: (string | number)[] = [];

      if (req.query.status && req.query.status !== "all") {
        params.push(req.query.status);
        where.push(`e.status = $${params.length}`);
      }
      if (req.query.source && req.query.source !== "all") {
        params.push(req.query.source);
        where.push(`e.source = $${params.length}`);
      }
      if (req.query.search && req.query.search.trim()) {
        const term = `%${req.query.search.trim().toLowerCase()}%`;
        params.push(term, term, term, term);
        const i = params.length - 3;
        where.push(
          `(LOWER(e.reference_code) LIKE $${i} OR LOWER(e.full_name) LIKE $${i + 1} OR LOWER(e.subject) LIKE $${i + 2} OR LOWER(e.category) LIKE $${i + 3})`
        );
      }

      const sql = `
        SELECT e.*, u.full_name AS assigned_staff_name
        FROM enquiries e
        LEFT JOIN admin_users u ON u.id = e.assigned_to_user_id
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT 200`;

      return db.all(sql, params);
    }
  );

  app.patch<{ Params: { id: string } }>(
    "/api/admin/enquiries/:id",
    { preHandler: requireAuth("enquiries.write") },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ error: "Invalid enquiry ID." });

      const parsed = updateEnquirySchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid update payload." });

      const db = getDb();
      const existing = await db.get<{
        id: number;
        reference_code: string;
        status: string;
        assigned_to_user_id: number | null;
        internal_notes: string;
        follow_up_notes: string;
      }>("SELECT id, reference_code, status, assigned_to_user_id, internal_notes, follow_up_notes FROM enquiries WHERE id = $1", [id]);

      if (!existing) return reply.code(404).send({ error: "Enquiry not found." });

      const nextStatus = parsed.data.status ?? existing.status;
      const nextAssignee =
        parsed.data.assignedToUserId !== undefined ? parsed.data.assignedToUserId : existing.assigned_to_user_id;
      const nextInternal =
        parsed.data.internalNotes !== undefined ? parsed.data.internalNotes : existing.internal_notes;
      const nextFollowUp =
        parsed.data.followUpNotes !== undefined ? parsed.data.followUpNotes : existing.follow_up_notes;
      const ts = nowIso();
      const resolvedAt = nextStatus === "resolved" ? ts : null;

      await db.run(
        `UPDATE enquiries
         SET status = $1,
             assigned_to_user_id = $2,
             internal_notes = $3,
             follow_up_notes = $4,
             resolved_at = COALESCE($5, resolved_at),
             updated_at = $6
         WHERE id = $7`,
        [nextStatus, nextAssignee, nextInternal, nextFollowUp, resolvedAt, ts, id]
      );

      await writeAuditLog({
        actorUserId: req.admin!.userId,
        actorEmail: req.admin!.email,
        actorRole: req.admin!.roleCode,
        action: "enquiry.update",
        entityType: "enquiry",
        entityId: existing.reference_code,
        summary: `Updated enquiry ${existing.reference_code}: status=${nextStatus}`,
        metadata: { previousStatus: existing.status, newStatus: nextStatus, assignedToUserId: nextAssignee },
        ipAddress: req.ip,
      });

      const updated = await db.get(
        `SELECT e.*, u.full_name AS assigned_staff_name
         FROM enquiries e LEFT JOIN admin_users u ON u.id = e.assigned_to_user_id
         WHERE e.id = $1`,
        [id]
      );
      return reply.send(updated);
    }
  );
}
