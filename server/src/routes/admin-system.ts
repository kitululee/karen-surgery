import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { getDb, nowIso } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.js";

const faqSchema = z.object({
  category: z.string().trim().min(2).max(100),
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(10).max(4000),
  keywords: z.array(z.string().trim()).default([]),
  suggestedFollowups: z.array(z.string().trim()).default([]),
  isPublished: z.boolean().default(true),
  isApproved: z.boolean().default(true),
  sortOrder: z.number().int().default(50),
});

const createUserSchema = z.object({
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().min(2).max(140),
  password: z.string().min(12, "Password must be at least 12 characters.").max(200),
  roleCode: z.enum(["SUPER_ADMIN", "CONTENT_ADMIN", "RECEPTION_OPERATIONS", "READ_ONLY"]),
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(140).optional(),
  roleCode: z.enum(["SUPER_ADMIN", "CONTENT_ADMIN", "RECEPTION_OPERATIONS", "READ_ONLY"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(12).max(200).optional(),
});

export async function adminSystemRoutes(app: FastifyInstance) {
  // === CHATBOT KNOWLEDGE MANAGEMENT ===
  app.get("/api/admin/chatbot/faqs", { preHandler: requireAuth("chatbot.read") }, async () => {
    const db = getDb();
    return db.all("SELECT * FROM chatbot_faqs ORDER BY sort_order ASC, id ASC");
  });

  app.post("/api/admin/chatbot/faqs", { preHandler: requireAuth("chatbot.write") }, async (req, reply) => {
    const parsed = faqSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message || "Invalid FAQ." });
    const d = parsed.data;
    const db = getDb();
    const ts = nowIso();
    const res = await db.run(
      `INSERT INTO chatbot_faqs (category, question, answer, keywords_json, suggested_followups_json, is_published, is_approved, sort_order, created_by, approved_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
      [
        d.category,
        d.question,
        d.answer,
        JSON.stringify(d.keywords),
        JSON.stringify(d.suggestedFollowups),
        d.isPublished ? 1 : 0,
        d.isApproved ? 1 : 0,
        d.sortOrder,
        req.admin!.userId,
        d.isApproved ? req.admin!.userId : null,
        ts,
      ]
    );
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "chatbot_faq.create",
      entityType: "chatbot_faq",
      entityId: res.lastInsertRowid,
      summary: `Created FAQ (${d.category}): "${d.question.slice(0, 80)}"`,
      ipAddress: req.ip,
    });
    return reply.code(201).send(await db.get("SELECT * FROM chatbot_faqs WHERE id = $1", [res.lastInsertRowid]));
  });

  app.patch<{ Params: { id: string } }>("/api/admin/chatbot/faqs/:id", { preHandler: requireAuth("chatbot.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = faqSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid FAQ update." });
    const db = getDb();
    const existing = await db.get<Record<string, unknown>>("SELECT * FROM chatbot_faqs WHERE id = $1", [id]);
    if (!existing) return reply.code(404).send({ error: "FAQ not found." });

    const d = parsed.data;
    const ts = nowIso();
    const nextApproved = d.isApproved !== undefined ? (d.isApproved ? 1 : 0) : (existing.is_approved as number);
    await db.run(
      `UPDATE chatbot_faqs SET category=$1, question=$2, answer=$3, keywords_json=$4, suggested_followups_json=$5,
       is_published=$6, is_approved=$7, approved_by=$8, sort_order=$9, updated_at=$10 WHERE id=$11`,
      [
        d.category ?? (existing.category as string),
        d.question ?? (existing.question as string),
        d.answer ?? (existing.answer as string),
        d.keywords ? JSON.stringify(d.keywords) : (existing.keywords_json as string),
        d.suggestedFollowups ? JSON.stringify(d.suggestedFollowups) : (existing.suggested_followups_json as string),
        d.isPublished !== undefined ? (d.isPublished ? 1 : 0) : (existing.is_published as number),
        nextApproved,
        nextApproved ? req.admin!.userId : null,
        d.sortOrder ?? (existing.sort_order as number),
        ts,
        id,
      ]
    );
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "chatbot_faq.update",
      entityType: "chatbot_faq",
      entityId: id,
      summary: `Updated FAQ #${id} (published=${d.isPublished ?? existing.is_published}, approved=${nextApproved})`,
      ipAddress: req.ip,
    });
    return reply.send(await db.get("SELECT * FROM chatbot_faqs WHERE id = $1", [id]));
  });

  app.delete<{ Params: { id: string } }>("/api/admin/chatbot/faqs/:id", { preHandler: requireAuth("chatbot.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = await db.get<{ question: string }>("SELECT question FROM chatbot_faqs WHERE id = $1", [id]);
    if (!existing) return reply.code(404).send({ error: "FAQ not found." });
    await db.run("DELETE FROM chatbot_faqs WHERE id = $1", [id]);
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "chatbot_faq.delete",
      entityType: "chatbot_faq",
      entityId: id,
      summary: `Deleted FAQ #${id}: "${existing.question.slice(0, 80)}"`,
      ipAddress: req.ip,
    });
    return reply.send({ ok: true });
  });

  app.get("/api/admin/chatbot/unanswered", { preHandler: requireAuth("chatbot.read") }, async () => {
    const db = getDb();
    return db.all("SELECT * FROM chatbot_unanswered ORDER BY created_at DESC, id DESC LIMIT 150");
  });

  app.patch<{ Params: { id: string } }>(
    "/api/admin/chatbot/unanswered/:id",
    { preHandler: requireAuth("chatbot.write") },
    async (req, reply) => {
      const id = Number(req.params.id);
      const parsed = z.object({ status: z.enum(["open", "reviewed", "converted", "dismissed"]) }).safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid status." });
      const db = getDb();
      await db.run("UPDATE chatbot_unanswered SET status = $1, updated_at = $2 WHERE id = $3", [
        parsed.data.status,
        nowIso(),
        id,
      ]);
      await writeAuditLog({
        actorUserId: req.admin!.userId,
        actorEmail: req.admin!.email,
        actorRole: req.admin!.roleCode,
        action: "chatbot_unanswered.update",
        entityType: "chatbot_unanswered",
        entityId: id,
        summary: `Marked unanswered question #${id} as ${parsed.data.status}`,
        ipAddress: req.ip,
      });
      return reply.send(await db.get("SELECT * FROM chatbot_unanswered WHERE id = $1", [id]));
    }
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/chatbot/unanswered/:id/convert",
    { preHandler: requireAuth("chatbot.write") },
    async (req, reply) => {
      const id = Number(req.params.id);
      const parsed = faqSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid FAQ payload for conversion." });
      const db = getDb();
      const unans = await db.get("SELECT id FROM chatbot_unanswered WHERE id = $1", [id]);
      if (!unans) return reply.code(404).send({ error: "Unanswered record not found." });

      const d = parsed.data;
      const ts = nowIso();
      const res = await db.run(
        `INSERT INTO chatbot_faqs (category, question, answer, keywords_json, suggested_followups_json, is_published, is_approved, sort_order, created_by, approved_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
        [d.category, d.question, d.answer, JSON.stringify(d.keywords), JSON.stringify(d.suggestedFollowups), d.isPublished ? 1 : 0, d.isApproved ? 1 : 0, d.sortOrder, req.admin!.userId, d.isApproved ? req.admin!.userId : null, ts]
      );
      await db.run(
        "UPDATE chatbot_unanswered SET status = 'converted', converted_faq_id = $1, updated_at = $2 WHERE id = $3",
        [res.lastInsertRowid, ts, id]
      );
      await writeAuditLog({
        actorUserId: req.admin!.userId,
        actorEmail: req.admin!.email,
        actorRole: req.admin!.roleCode,
        action: "chatbot_unanswered.convert",
        entityType: "chatbot_faq",
        entityId: res.lastInsertRowid,
        summary: `Converted unanswered question #${id} into approved FAQ #${res.lastInsertRowid}`,
        ipAddress: req.ip,
      });
      return reply.code(201).send(await db.get("SELECT * FROM chatbot_faqs WHERE id = $1", [res.lastInsertRowid]));
    }
  );

  // === WEBSITE SETTINGS (with extra confirmation on Emergency Contact changes!) ===
  app.get("/api/admin/settings", { preHandler: requireAuth("cms.read") }, async () => {
    const db = getDb();
    const row = await db.get<Record<string, unknown>>("SELECT * FROM website_settings WHERE id = 1");
    if (!row) return {};
    return {
      openingHours: JSON.parse(String(row.opening_hours_json || "{}")),
      contact: JSON.parse(String(row.contact_json || "{}")),
      emergency: JSON.parse(String(row.emergency_json || "{}")),
      location: JSON.parse(String(row.location_json || "{}")),
      navigation: JSON.parse(String(row.navigation_json || "[]")),
      footer: JSON.parse(String(row.footer_json || "{}")),
      chatbotConfig: JSON.parse(String(row.chatbot_config_json || "{}")),
      dataRetentionDays: Number(row.data_retention_days ?? 365),
      updatedAt: row.updated_at,
    };
  });

  app.patch("/api/admin/settings", { preHandler: requireAuth("settings.write") }, async (req, reply) => {
    const parsed = z
      .object({
        openingHours: z.record(z.unknown()).optional(),
        contact: z.record(z.unknown()).optional(),
        location: z.record(z.unknown()).optional(),
        navigation: z.array(z.record(z.unknown())).optional(),
        footer: z.record(z.unknown()).optional(),
        chatbotConfig: z.record(z.unknown()).optional(),
        dataRetentionDays: z.number().int().min(30).max(3650).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid settings payload." });

    const db = getDb();
    const row = await db.get<Record<string, unknown>>("SELECT * FROM website_settings WHERE id = 1");
    if (!row) return reply.code(404).send({ error: "Settings not initialized." });

    const d = parsed.data;
    const ts = nowIso();
    await db.run(
      `UPDATE website_settings SET
        opening_hours_json=$1, contact_json=$2, location_json=$3,
        navigation_json=$4, footer_json=$5, chatbot_config_json=$6,
        data_retention_days=$7, updated_by=$8, updated_at=$9
       WHERE id = 1`,
      [
        d.openingHours ? JSON.stringify(d.openingHours) : String(row.opening_hours_json),
        d.contact ? JSON.stringify(d.contact) : String(row.contact_json),
        d.location ? JSON.stringify(d.location) : String(row.location_json),
        d.navigation ? JSON.stringify(d.navigation) : String(row.navigation_json),
        d.footer ? JSON.stringify(d.footer) : String(row.footer_json),
        d.chatbotConfig ? JSON.stringify(d.chatbotConfig) : String(row.chatbot_config_json),
        d.dataRetentionDays ?? Number(row.data_retention_days),
        req.admin!.userId,
        ts,
      ]
    );
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "settings.update",
      entityType: "website_settings",
      entityId: "1",
      summary: `Updated website settings (${Object.keys(d).join(", ")})`,
      ipAddress: req.ip,
    });
    return reply.send({ ok: true, updatedAt: ts });
  });

  // Separate protected endpoint requiring SUPER_ADMIN + explicit confirmation phrase
  app.patch(
    "/api/admin/settings/emergency",
    { preHandler: requireAuth("settings.emergency") },
    async (req, reply) => {
      const parsed = z
        .object({
          confirmPhrase: z.literal("CONFIRM EMERGENCY CHANGE", {
            errorMap: () => ({ message: "Type 'CONFIRM EMERGENCY CHANGE' to authorise emergency contact updates." }),
          }),
          emergency: z.object({
            phoneDisplay: z.string().trim().min(6).max(60),
            phoneTel: z.string().trim().min(6).max(30),
            bannerText: z.string().trim().min(10).max(500),
            ambulances: z.array(
              z.object({
                provider: z.string().trim().min(2).max(100),
                numbers: z.array(z.string().trim().min(4).max(60)).min(1),
              })
            ),
          }),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message || "Invalid emergency settings." });
      }
      const db = getDb();
      const ts = nowIso();
      await db.run(
        "UPDATE website_settings SET emergency_json = $1, updated_by = $2, updated_at = $3 WHERE id = 1",
        [JSON.stringify(parsed.data.emergency), req.admin!.userId, ts]
      );
      await writeAuditLog({
        actorUserId: req.admin!.userId,
        actorEmail: req.admin!.email,
        actorRole: req.admin!.roleCode,
        action: "settings.emergency_update",
        entityType: "website_settings",
        entityId: "emergency",
        summary: `Confirmed update to emergency contact details (${parsed.data.emergency.phoneDisplay})`,
        ipAddress: req.ip,
      });
      return reply.send({ ok: true, emergency: parsed.data.emergency, updatedAt: ts });
    }
  );

  // === USER & ROLE MANAGEMENT (SUPER_ADMIN ONLY) ===
  app.get("/api/admin/roles", { preHandler: requireAuth("users.read") }, async () => {
    const db = getDb();
    return db.all("SELECT id, code, name, description FROM roles ORDER BY id ASC");
  });

  app.get("/api/admin/users", { preHandler: requireAuth("users.read") }, async () => {
    const db = getDb();
    return db.all(
      `SELECT u.id, u.email, u.full_name, u.is_active, u.last_login_at, u.created_at,
              r.code AS role_code, r.name AS role_name
       FROM admin_users u JOIN roles r ON r.id = u.role_id
       ORDER BY u.id ASC`
    );
  });

  app.post("/api/admin/users", { preHandler: requireAuth("users.write") }, async (req, reply) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message || "Invalid user data." });

    const db = getDb();
    const email = parsed.data.email.toLowerCase();
    if (await db.get("SELECT id FROM admin_users WHERE email = $1", [email])) {
      return reply.code(409).send({ error: "An administrator with that email already exists." });
    }
    const role = await db.get<{ id: number }>("SELECT id FROM roles WHERE code = $1", [parsed.data.roleCode]);
    if (!role) return reply.code(400).send({ error: "Invalid role." });

    const passwordHash = await argon2.hash(parsed.data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
    const ts = nowIso();
    const res = await db.run(
      `INSERT INTO admin_users (email, full_name, password_hash, role_id, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,1,$5,$5)`,
      [email, parsed.data.fullName, passwordHash, role.id, ts]
    );
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "admin_user.create",
      entityType: "admin_user",
      entityId: res.lastInsertRowid,
      summary: `Created admin user ${email} with role ${parsed.data.roleCode}`,
      ipAddress: req.ip,
    });
    return reply.code(201).send(
      await db.get(
        `SELECT u.id, u.email, u.full_name, u.is_active, u.created_at, r.code AS role_code, r.name AS role_name
         FROM admin_users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
        [res.lastInsertRowid]
      )
    );
  });

  app.patch<{ Params: { id: string } }>("/api/admin/users/:id", { preHandler: requireAuth("users.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid user update." });

    const db = getDb();
    const existing = await db.get<{ id: number; email: string; full_name: string; role_id: number; is_active: number }>(
      "SELECT id, email, full_name, role_id, is_active FROM admin_users WHERE id = $1",
      [id]
    );
    if (!existing) return reply.code(404).send({ error: "User not found." });

    if (id === req.admin!.userId && parsed.data.isActive === false) {
      return reply.code(400).send({ error: "You cannot deactivate your own Super Admin account." });
    }

    let nextRoleId = existing.role_id;
    if (parsed.data.roleCode) {
      const role = await db.get<{ id: number }>("SELECT id FROM roles WHERE code = $1", [parsed.data.roleCode]);
      if (role) nextRoleId = role.id;
    }

    const ts = nowIso();
    if (parsed.data.password) {
      const passwordHash = await argon2.hash(parsed.data.password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });
      await db.run("UPDATE admin_users SET password_hash = $1, updated_at = $2 WHERE id = $3", [passwordHash, ts, id]);
      await db.run("DELETE FROM admin_sessions WHERE user_id = $1", [id]);
    }

    await db.run(
      "UPDATE admin_users SET full_name = $1, role_id = $2, is_active = $3, updated_at = $4 WHERE id = $5",
      [
        parsed.data.fullName ?? existing.full_name,
        nextRoleId,
        parsed.data.isActive !== undefined ? (parsed.data.isActive ? 1 : 0) : existing.is_active,
        ts,
        id,
      ]
    );
    if (parsed.data.isActive === false) {
      await db.run("DELETE FROM admin_sessions WHERE user_id = $1", [id]);
    }

    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "admin_user.update",
      entityType: "admin_user",
      entityId: id,
      summary: `Updated admin user ${existing.email}`,
      metadata: { roleCode: parsed.data.roleCode, isActive: parsed.data.isActive },
      ipAddress: req.ip,
    });
    return reply.send(
      await db.get(
        `SELECT u.id, u.email, u.full_name, u.is_active, u.last_login_at, u.created_at, r.code AS role_code, r.name AS role_name
         FROM admin_users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
        [id]
      )
    );
  });

  // === AUDIT LOGS (SUPER_ADMIN ONLY) ===
  app.get<{ Querystring: { entityType?: string; search?: string; limit?: string } }>(
    "/api/admin/audit-logs",
    { preHandler: requireAuth("audit.read") },
    async (req) => {
      const db = getDb();
      const where: string[] = [];
      const params: (string | number)[] = [];

      if (req.query.entityType && req.query.entityType !== "all") {
        params.push(req.query.entityType);
        where.push(`entity_type = $${params.length}`);
      }
      if (req.query.search && req.query.search.trim()) {
        const term = `%${req.query.search.trim().toLowerCase()}%`;
        params.push(term, term, term);
        const i = params.length - 2;
        where.push(`(LOWER(actor_email) LIKE $${i} OR LOWER(action) LIKE $${i + 1} OR LOWER(summary) LIKE $${i + 2})`);
      }

      const limit = Math.min(300, Math.max(10, Number(req.query.limit || 100)));
      params.push(limit);

      return db.all(
        `SELECT * FROM audit_logs ${where.length ? "WHERE " + where.join(" AND ") : ""}
         ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
        params
      );
    }
  );
}
