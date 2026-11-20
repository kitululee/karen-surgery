import crypto from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { type DbClient, getDb } from "../db/database.js";

export const SESSION_COOKIE_NAME = "ks_admin_session";

export interface AuthenticatedAdmin {
  userId: number;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
  sessionId: number;
  csrfToken: string;
}

declare module "fastify" {
  interface FastifyRequest {
    admin?: AuthenticatedAdmin;
  }
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function loadAdminFromRequest(
  req: FastifyRequest,
  db: DbClient = getDb()
): Promise<AuthenticatedAdmin | null> {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!rawToken || typeof rawToken !== "string") return null;

  const tokenHash = hashToken(rawToken);
  const row = await db.get<{
    session_id: number;
    csrf_token: string;
    expires_at: string;
    user_id: number;
    email: string;
    full_name: string;
    is_active: number;
    role_id: number;
    role_code: string;
    role_name: string;
  }>(
    `SELECT
       s.id AS session_id, s.csrf_token, s.expires_at,
       u.id AS user_id, u.email, u.full_name, u.is_active, u.role_id,
       r.code AS role_code, r.name AS role_name
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE s.token_hash = $1`,
    [tokenHash]
  );

  if (!row || !row.is_active) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.run("DELETE FROM admin_sessions WHERE id = $1", [row.session_id]);
    return null;
  }

  const perms = await db.all<{ code: string }>(
    `SELECT p.code
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1`,
    [row.role_id]
  );

  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    roleCode: row.role_code,
    roleName: row.role_name,
    permissions: perms.map((x) => x.code),
    sessionId: row.session_id,
    csrfToken: row.csrf_token,
  };
}

export function requireAuth(permission?: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const admin = await loadAdminFromRequest(req);
    if (!admin) {
      return reply.code(401).send({ error: "Authentication required." });
    }

    // Enforce CSRF token header on all mutating admin requests
    const method = req.method.toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const providedCsrf = String(req.headers["x-csrf-token"] || "");
      const expected = Buffer.from(admin.csrfToken);
      const actual = Buffer.from(providedCsrf);
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        return reply.code(403).send({ error: "Invalid or missing CSRF token." });
      }
    }

    if (permission && !admin.permissions.includes(permission)) {
      return reply.code(403).send({
        error: `Forbidden: role ${admin.roleCode} lacks required permission '${permission}'.`,
      });
    }

    req.admin = admin;
  };
}
