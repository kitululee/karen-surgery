import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { getDb, nowIso } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.js";

const pageCreateSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens.").max(80),
  title: z.string().trim().min(2).max(160),
  metaTitle: z.string().trim().max(180).optional().default(""),
  metaDescription: z.string().trim().max(320).optional().default(""),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
});

const pageUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  metaTitle: z.string().trim().max(180).optional(),
  metaDescription: z.string().trim().max(320).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const sectionUpsertSchema = z.object({
  sectionKey: z.string().trim().min(1).max(80),
  sectionType: z.enum(["hero", "intro", "service", "info_panel", "cta", "text"]).default("text"),
  heading: z.string().trim().max(240).default(""),
  subheading: z.string().trim().max(500).default(""),
  bodyJson: z.record(z.unknown()).default({}),
  ctaLabel: z.string().trim().max(100).default(""),
  ctaHref: z.string().trim().max(240).default(""),
  mediaAssetId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});

const practitionerSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(100).optional(),
  name: z.string().trim().min(2).max(140),
  qualifications: z.string().trim().max(260).optional().default(""),
  roleTitle: z.string().trim().min(2).max(120),
  department: z.enum(["doctors", "radiology", "mental-health", "physiotherapy", "allied-health", "support"]),
  departmentLabel: z.string().trim().min(2).max(120).optional(),
  departmentHref: z.string().trim().max(160).optional(),
  quote: z.string().trim().max(400).optional().default(""),
  bio: z.array(z.string().trim().min(1)).default([]),
  specialties: z.array(z.string().trim()).default([]),
  email: z.string().trim().email().nullable().optional().or(z.literal("")),
  phones: z.array(z.object({ display: z.string(), tel: z.string() })).optional().default([]),
  mediaAssetId: z.number().int().positive().nullable().optional(),
  imagePosition: z.string().trim().max(40).optional().default("50% 25%"),
  isActive: z.boolean().optional().default(true),
  isApproved: z.boolean().optional().default(true),
  isArchived: z.boolean().optional().default(false),
  serviceIds: z.array(z.number().int().positive()).optional(),
});

const serviceSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80).optional(),
  title: z.string().trim().min(2).max(140),
  shortTitle: z.string().trim().min(2).max(80),
  icon: z.string().trim().max(40).optional().default("stethoscope"),
  description: z.string().trim().max(1200).default(""),
  highlights: z.array(z.string().trim()).default([]),
  href: z.string().trim().max(180).optional().default("/services/"),
  contactEmail: z.string().trim().email().nullable().optional().or(z.literal("")),
  mediaAssetId: z.number().int().positive().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(10),
  practitionerIds: z.array(z.number().int().positive()).optional(),
});

// Strict magic-byte image signature verification (prevents MIME spoofing)
function detectImageType(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: "image/png", ext: ".png" };
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: ".webp" };
  }
  if (buf.toString("ascii", 4, 8) === "ftyp" && /avif|avis/i.test(buf.toString("ascii", 8, 16))) {
    return { mime: "image/avif", ext: ".avif" };
  }
  return null;
}

export async function adminCmsRoutes(app: FastifyInstance) {
  // === PAGES & SECTIONS ===
  app.get("/api/admin/pages", { preHandler: requireAuth("cms.read") }, async () => {
    const db = getDb();
    const pages = await db.all("SELECT * FROM pages ORDER BY id ASC");
    const sections = await db.all(
      `SELECT ps.*, m.public_url AS media_url, m.alt_text AS media_alt
       FROM page_sections ps LEFT JOIN media_assets m ON m.id = ps.media_asset_id
       ORDER BY ps.sort_order ASC, ps.id ASC`
    );
    const byPage = new Map<number, unknown[]>();
    for (const s of sections as { page_id: number }[]) {
      const arr = byPage.get(s.page_id) || [];
      arr.push(s);
      byPage.set(s.page_id, arr);
    }
    return (pages as { id: number }[]).map((p) => ({ ...p, sections: byPage.get(p.id) || [] }));
  });

  app.post("/api/admin/pages", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const parsed = pageCreateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message || "Invalid page data." });

    const db = getDb();
    const exists = await db.get("SELECT id FROM pages WHERE slug = $1", [parsed.data.slug]);
    if (exists) return reply.code(409).send({ error: "A page with this slug already exists." });

    const ts = nowIso();
    const pubAt = parsed.data.status === "published" ? ts : null;
    const res = await db.run(
      `INSERT INTO pages (slug, title, meta_title, meta_description, status, is_system_page, published_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,0,$6,$7,$7)`,
      [parsed.data.slug, parsed.data.title, parsed.data.metaTitle || parsed.data.title, parsed.data.metaDescription, parsed.data.status, pubAt, ts]
    );
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "page.create",
      entityType: "page",
      entityId: res.lastInsertRowid,
      summary: `Created page /${parsed.data.slug}/ (${parsed.data.status})`,
      ipAddress: req.ip,
    });
    const page = await db.get("SELECT * FROM pages WHERE id = $1", [res.lastInsertRowid]);
    return reply.code(201).send(page);
  });

  app.patch<{ Params: { id: string } }>("/api/admin/pages/:id", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = pageUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid page update." });

    const db = getDb();
    const existing = await db.get<{ id: number; slug: string; title: string; meta_title: string; meta_description: string; status: string }>(
      "SELECT * FROM pages WHERE id = $1",
      [id]
    );
    if (!existing) return reply.code(404).send({ error: "Page not found." });

    const nextStatus = parsed.data.status ?? existing.status;
    const ts = nowIso();
    const pubAt = nextStatus === "published" ? ts : null;

    await db.run(
      `UPDATE pages SET title=$1, meta_title=$2, meta_description=$3, status=$4,
       published_at=COALESCE($5, published_at), updated_at=$6 WHERE id=$7`,
      [
        parsed.data.title ?? existing.title,
        parsed.data.metaTitle ?? existing.meta_title,
        parsed.data.metaDescription ?? existing.meta_description,
        nextStatus,
        pubAt,
        ts,
        id,
      ]
    );

    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "page.update",
      entityType: "page",
      entityId: existing.slug,
      summary: `Updated page /${existing.slug}/ (status=${nextStatus})`,
      ipAddress: req.ip,
    });
    return reply.send(await db.get("SELECT * FROM pages WHERE id = $1", [id]));
  });

  app.put<{ Params: { id: string } }>("/api/admin/pages/:id/sections", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const pageId = Number(req.params.id);
    const parsed = sectionUpsertSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid section payload." });

    const db = getDb();
    const page = await db.get<{ slug: string }>("SELECT slug FROM pages WHERE id = $1", [pageId]);
    if (!page) return reply.code(404).send({ error: "Page not found." });

    const d = parsed.data;
    const ts = nowIso();
    const existing = await db.get<{ id: number }>(
      "SELECT id FROM page_sections WHERE page_id = $1 AND section_key = $2",
      [pageId, d.sectionKey]
    );

    if (existing) {
      await db.run(
        `UPDATE page_sections SET section_type=$1, heading=$2, subheading=$3, body_json=$4,
         cta_label=$5, cta_href=$6, media_asset_id=$7, sort_order=$8, is_published=$9, updated_at=$10
         WHERE id=$11`,
        [d.sectionType, d.heading, d.subheading, JSON.stringify(d.bodyJson), d.ctaLabel, d.ctaHref, d.mediaAssetId ?? null, d.sortOrder, d.isPublished ? 1 : 0, ts, existing.id]
      );
    } else {
      await db.run(
        `INSERT INTO page_sections (page_id, section_key, section_type, heading, subheading, body_json, cta_label, cta_href, media_asset_id, sort_order, is_published, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [pageId, d.sectionKey, d.sectionType, d.heading, d.subheading, JSON.stringify(d.bodyJson), d.ctaLabel, d.ctaHref, d.mediaAssetId ?? null, d.sortOrder, d.isPublished ? 1 : 0, ts]
      );
    }

    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "page_section.upsert",
      entityType: "page",
      entityId: page.slug,
      summary: `Saved section '${d.sectionKey}' on page /${page.slug}/`,
      ipAddress: req.ip,
    });
    return reply.send(await db.all("SELECT * FROM page_sections WHERE page_id = $1 ORDER BY sort_order ASC", [pageId]));
  });

  // === PRACTITIONERS ===
  app.get("/api/admin/practitioners", { preHandler: requireAuth("cms.read") }, async () => {
    const db = getDb();
    const rows = await db.all(
      `SELECT p.*, m.public_url AS media_url, m.alt_text AS media_alt
       FROM practitioners p LEFT JOIN media_assets m ON m.id = p.media_asset_id
       ORDER BY p.is_archived ASC, p.sort_order ASC, p.id ASC`
    );
    const links = await db.all<{ practitioner_id: number; service_id: number }>(
      "SELECT practitioner_id, service_id FROM practitioner_services"
    );
    const map = new Map<number, number[]>();
    for (const l of links) {
      const arr = map.get(l.practitioner_id) || [];
      arr.push(l.service_id);
      map.set(l.practitioner_id, arr);
    }
    return (rows as { id: number }[]).map((r) => ({ ...r, serviceIds: map.get(r.id) || [] }));
  });

  app.post("/api/admin/practitioners", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const parsed = practitionerSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message || "Invalid practitioner payload." });

    const d = parsed.data;
    const db = getDb();
    const slug =
      d.slug ||
      d.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const exists = await db.get("SELECT id FROM practitioners WHERE slug = $1", [slug]);
    if (exists) return reply.code(409).send({ error: "Practitioner with this slug already exists." });

    const deptHrefMap: Record<string, string> = {
      doctors: "/doctors/",
      radiology: "/doctors/#ultrasound",
      "mental-health": "/mental-health/",
      physiotherapy: "/physiotherapy/",
      "allied-health": "/allied-health-professionals/",
      support: "/opening-hours/",
    };
    const ts = nowIso();
    const res = await db.run(
      `INSERT INTO practitioners (
        slug, name, qualifications, role_title, department, department_label, department_href,
        quote, bio_json, specialties_json, email, phones_json, media_asset_id, image_position,
        is_active, is_approved, is_archived, sort_order, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,50,$18,$18)`,
      [
        slug,
        d.name,
        d.qualifications,
        d.roleTitle,
        d.department,
        d.departmentLabel || d.department,
        d.departmentHref || deptHrefMap[d.department] || "/team/",
        d.quote,
        JSON.stringify(d.bio),
        JSON.stringify(d.specialties),
        d.email || null,
        JSON.stringify(d.phones),
        d.mediaAssetId ?? null,
        d.imagePosition,
        d.isActive ? 1 : 0,
        d.isApproved ? 1 : 0,
        d.isArchived ? 1 : 0,
        ts,
      ]
    );
    const pracId = res.lastInsertRowid;
    if (d.serviceIds) {
      for (const sId of d.serviceIds) {
        await db.run("INSERT INTO practitioner_services (practitioner_id, service_id) VALUES ($1, $2)", [pracId, sId]);
      }
    }

    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "practitioner.create",
      entityType: "practitioner",
      entityId: pracId,
      summary: `Added practitioner ${d.name} (${d.roleTitle})`,
      ipAddress: req.ip,
    });
    return reply.code(201).send(await db.get("SELECT * FROM practitioners WHERE id = $1", [pracId]));
  });

  app.patch<{ Params: { id: string } }>("/api/admin/practitioners/:id", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = practitionerSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid practitioner update." });

    const db = getDb();
    const existing = await db.get<Record<string, unknown>>("SELECT * FROM practitioners WHERE id = $1", [id]);
    if (!existing) return reply.code(404).send({ error: "Practitioner not found." });

    const d = parsed.data;
    const ts = nowIso();
    await db.run(
      `UPDATE practitioners SET
        name=$1, qualifications=$2, role_title=$3, department=$4, quote=$5,
        bio_json=$6, specialties_json=$7, email=$8, phones_json=$9,
        media_asset_id=$10, image_position=$11,
        is_active=$12, is_approved=$13, is_archived=$14, updated_at=$15
       WHERE id=$16`,
      [
        d.name ?? (existing.name as string),
        d.qualifications ?? (existing.qualifications as string),
        d.roleTitle ?? (existing.role_title as string),
        d.department ?? (existing.department as string),
        d.quote ?? (existing.quote as string),
        d.bio ? JSON.stringify(d.bio) : (existing.bio_json as string),
        d.specialties ? JSON.stringify(d.specialties) : (existing.specialties_json as string),
        d.email !== undefined ? (d.email || null) : (existing.email as string | null),
        d.phones ? JSON.stringify(d.phones) : (existing.phones_json as string),
        d.mediaAssetId !== undefined ? d.mediaAssetId : (existing.media_asset_id as number | null),
        d.imagePosition ?? (existing.image_position as string),
        d.isActive !== undefined ? (d.isActive ? 1 : 0) : (existing.is_active as number),
        d.isApproved !== undefined ? (d.isApproved ? 1 : 0) : (existing.is_approved as number),
        d.isArchived !== undefined ? (d.isArchived ? 1 : 0) : (existing.is_archived as number),
        ts,
        id,
      ]
    );

    if (d.serviceIds) {
      await db.run("DELETE FROM practitioner_services WHERE practitioner_id = $1", [id]);
      for (const sId of d.serviceIds) {
        await db.run("INSERT INTO practitioner_services (practitioner_id, service_id) VALUES ($1, $2)", [id, sId]);
      }
    }

    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "practitioner.update",
      entityType: "practitioner",
      entityId: id,
      summary: `Updated practitioner ${d.name ?? existing.name}`,
      ipAddress: req.ip,
    });
    return reply.send(await db.get("SELECT * FROM practitioners WHERE id = $1", [id]));
  });

  // === SERVICES ===
  app.get("/api/admin/services", { preHandler: requireAuth("cms.read") }, async () => {
    const db = getDb();
    const services = await db.all(
      `SELECT s.*, m.public_url AS media_url
       FROM services s LEFT JOIN media_assets m ON m.id = s.media_asset_id
       ORDER BY s.sort_order ASC, s.id ASC`
    );
    const links = await db.all<{ practitioner_id: number; service_id: number }>(
      "SELECT practitioner_id, service_id FROM practitioner_services"
    );
    const map = new Map<number, number[]>();
    for (const l of links) {
      const arr = map.get(l.service_id) || [];
      arr.push(l.practitioner_id);
      map.set(l.service_id, arr);
    }
    return (services as { id: number }[]).map((s) => ({ ...s, practitionerIds: map.get(s.id) || [] }));
  });

  app.post("/api/admin/services", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid service payload." });
    const d = parsed.data;
    const db = getDb();
    const slug = d.slug || d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (await db.get("SELECT id FROM services WHERE slug = $1", [slug])) {
      return reply.code(409).send({ error: "Service slug already exists." });
    }
    const ts = nowIso();
    const res = await db.run(
      `INSERT INTO services (slug, title, short_title, icon, description, highlights_json, href, contact_email, media_asset_id, is_published, sort_order, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
      [slug, d.title, d.shortTitle, d.icon, d.description, JSON.stringify(d.highlights), d.href, d.contactEmail || null, d.mediaAssetId ?? null, d.isPublished ? 1 : 0, d.sortOrder, ts]
    );
    const serviceId = res.lastInsertRowid;
    if (d.practitionerIds) {
      for (const pId of d.practitionerIds) {
        await db.run("INSERT INTO practitioner_services (practitioner_id, service_id) VALUES ($1, $2)", [pId, serviceId]);
      }
    }
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "service.create",
      entityType: "service",
      entityId: serviceId,
      summary: `Created service ${d.title}`,
      ipAddress: req.ip,
    });
    return reply.code(201).send(await db.get("SELECT * FROM services WHERE id = $1", [serviceId]));
  });

  app.patch<{ Params: { id: string } }>("/api/admin/services/:id", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid service update." });

    const db = getDb();
    const existing = await db.get<Record<string, unknown>>("SELECT * FROM services WHERE id = $1", [id]);
    if (!existing) return reply.code(404).send({ error: "Service not found." });

    const d = parsed.data;
    const ts = nowIso();
    await db.run(
      `UPDATE services SET title=$1, short_title=$2, icon=$3, description=$4, highlights_json=$5,
       href=$6, contact_email=$7, media_asset_id=$8, is_published=$9, sort_order=$10, updated_at=$11
       WHERE id=$12`,
      [
        d.title ?? (existing.title as string),
        d.shortTitle ?? (existing.short_title as string),
        d.icon ?? (existing.icon as string),
        d.description ?? (existing.description as string),
        d.highlights ? JSON.stringify(d.highlights) : (existing.highlights_json as string),
        d.href ?? (existing.href as string),
        d.contactEmail !== undefined ? (d.contactEmail || null) : (existing.contact_email as string | null),
        d.mediaAssetId !== undefined ? d.mediaAssetId : (existing.media_asset_id as number | null),
        d.isPublished !== undefined ? (d.isPublished ? 1 : 0) : (existing.is_published as number),
        d.sortOrder ?? (existing.sort_order as number),
        ts,
        id,
      ]
    );
    if (d.practitionerIds) {
      await db.run("DELETE FROM practitioner_services WHERE service_id = $1", [id]);
      for (const pId of d.practitionerIds) {
        await db.run("INSERT INTO practitioner_services (practitioner_id, service_id) VALUES ($1, $2)", [pId, id]);
      }
    }
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "service.update",
      entityType: "service",
      entityId: id,
      summary: `Updated service ${d.title ?? existing.title}`,
      ipAddress: req.ip,
    });
    return reply.send(await db.get("SELECT * FROM services WHERE id = $1", [id]));
  });

  app.put("/api/admin/services/reorder", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const parsed = z.object({ orderedIds: z.array(z.number().int().positive()).min(1) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "orderedIds array required." });
    const db = getDb();
    const ts = nowIso();
    for (let i = 0; i < parsed.data.orderedIds.length; i++) {
      await db.run("UPDATE services SET sort_order = $1, updated_at = $2 WHERE id = $3", [
        i + 1,
        ts,
        parsed.data.orderedIds[i],
      ]);
    }
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "service.reorder",
      entityType: "service",
      summary: `Reordered ${parsed.data.orderedIds.length} services`,
      ipAddress: req.ip,
    });
    return reply.send({ ok: true });
  });

  // === MEDIA LIBRARY (Validated Upload + In-Use Deletion Protection) ===
  app.get("/api/admin/media", { preHandler: requireAuth("cms.read") }, async () => {
    const db = getDb();
    return db.all(
      `SELECT m.*,
        (SELECT COUNT(*) FROM practitioners WHERE media_asset_id = m.id) AS practitioner_refs,
        (SELECT COUNT(*) FROM services WHERE media_asset_id = m.id) AS service_refs,
        (SELECT COUNT(*) FROM page_sections WHERE media_asset_id = m.id) AS section_refs
       FROM media_assets m
       ORDER BY m.created_at DESC, m.id DESC`
    );
  });

  app.post("/api/admin/media/upload", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: "No file uploaded." });

    const buf = await file.toBuffer();
    if (buf.length === 0 || buf.length > config.maxUploadBytes) {
      return reply.code(400).send({ error: `File must be non-empty and under ${config.maxUploadBytes / (1024 * 1024)} MB.` });
    }

    const detected = detectImageType(buf);
    if (!detected) {
      return reply.code(400).send({ error: "Unsupported or invalid image file. Only JPEG, PNG, WebP, and AVIF images are allowed." });
    }

    fs.mkdirSync(config.uploadDir, { recursive: true });
    const safeName = `${crypto.randomUUID()}${detected.ext}`;
    const fullPath = path.join(config.uploadDir, safeName);
    fs.writeFileSync(fullPath, buf);

    const altField = (file.fields?.altText as { value?: string } | undefined)?.value || "";
    const publicUrl = `${config.publicApiUrl}/uploads/${safeName}`;
    const db = getDb();
    const ts = nowIso();
    const res = await db.run(
      `INSERT INTO media_assets (filename, original_name, mime_type, size_bytes, alt_text, storage_path, public_url, is_system_asset, uploaded_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$9)`,
      [safeName, file.filename.slice(0, 180), detected.mime, buf.length, altField.slice(0, 300), fullPath, publicUrl, req.admin!.userId, ts]
    );

    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "media.upload",
      entityType: "media_asset",
      entityId: res.lastInsertRowid,
      summary: `Uploaded media asset ${file.filename} (${detected.mime}, ${buf.length} bytes)`,
      ipAddress: req.ip,
    });
    return reply.code(201).send(await db.get("SELECT * FROM media_assets WHERE id = $1", [res.lastInsertRowid]));
  });

  app.patch<{ Params: { id: string } }>("/api/admin/media/:id", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = z.object({ altText: z.string().trim().max(300) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Valid altText required." });

    const db = getDb();
    const existing = await db.get("SELECT id, filename FROM media_assets WHERE id = $1", [id]);
    if (!existing) return reply.code(404).send({ error: "Media asset not found." });

    await db.run("UPDATE media_assets SET alt_text = $1, updated_at = $2 WHERE id = $3", [
      parsed.data.altText,
      nowIso(),
      id,
    ]);
    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "media.update_alt",
      entityType: "media_asset",
      entityId: id,
      summary: `Updated alt text for media #${id}`,
      ipAddress: req.ip,
    });
    return reply.send(await db.get("SELECT * FROM media_assets WHERE id = $1", [id]));
  });

  app.delete<{ Params: { id: string } }>("/api/admin/media/:id", { preHandler: requireAuth("cms.write") }, async (req, reply) => {
    const id = Number(req.params.id);
    const db = getDb();
    const asset = await db.get<{ id: number; filename: string; storage_path: string; is_system_asset: number }>(
      "SELECT id, filename, storage_path, is_system_asset FROM media_assets WHERE id = $1",
      [id]
    );
    if (!asset) return reply.code(404).send({ error: "Media asset not found." });

    // Prevent accidental deletion of any media currently assigned to practitioners, services, or page sections
    const pracRefs = await db.get<{ c: number }>("SELECT COUNT(*) as c FROM practitioners WHERE media_asset_id = $1", [id]);
    const svcRefs = await db.get<{ c: number }>("SELECT COUNT(*) as c FROM services WHERE media_asset_id = $1", [id]);
    const secRefs = await db.get<{ c: number }>("SELECT COUNT(*) as c FROM page_sections WHERE media_asset_id = $1", [id]);
    const totalRefs = Number(pracRefs?.c ?? 0) + Number(svcRefs?.c ?? 0) + Number(secRefs?.c ?? 0);

    if (totalRefs > 0) {
      return reply.code(409).send({
        error: `Cannot delete media asset while in use (${totalRefs} active reference(s)). Unassign it first.`,
        references: {
          practitioners: Number(pracRefs?.c ?? 0),
          services: Number(svcRefs?.c ?? 0),
          pageSections: Number(secRefs?.c ?? 0),
        },
      });
    }

    await db.run("DELETE FROM media_assets WHERE id = $1", [id]);
    if (!asset.is_system_asset && asset.storage_path && fs.existsSync(asset.storage_path)) {
      fs.unlinkSync(asset.storage_path);
    }

    await writeAuditLog({
      actorUserId: req.admin!.userId,
      actorEmail: req.admin!.email,
      actorRole: req.admin!.roleCode,
      action: "media.delete",
      entityType: "media_asset",
      entityId: id,
      summary: `Deleted unused media asset ${asset.filename}`,
      ipAddress: req.ip,
    });
    return reply.send({ ok: true });
  });
}
