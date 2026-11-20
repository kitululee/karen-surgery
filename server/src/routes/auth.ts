import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { config } from "../config.js";
import { getDb, nowIso } from "../db/database.js";
import {
  SESSION_COOKIE_NAME,
  generateSecureToken,
  hashToken,
  loadAdminFromRequest,
  requireAuth,
} from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.js";
import { sendPasswordResetEmail } from "../services/email.js";

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

const forgotSchema = z.object({
  email: z.string().email().max(200),
});

const resetSchema = z.object({
  token: z.string().min(32).max(200),
  newPassword: z.string().min(12, "Password must be at least 12 characters.").max(200),
});

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "15 minutes",
        },
      },
    },
    async (req, reply) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Valid email and password are required." });
      }

      const db = getDb();
      const email = parsed.data.email.trim().toLowerCase();
      const user = await db.get<{
        id: number;
        email: string;
        full_name: string;
        password_hash: string;
        is_active: number;
        role_id: number;
        role_code: string;
        role_name: string;
      }>(
        `SELECT u.id, u.email, u.full_name, u.password_hash, u.is_active, u.role_id,
                r.code AS role_code, r.name AS role_name
         FROM admin_users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.email = $1`,
        [email]
      );

      if (!user || !user.is_active) {
        await writeAuditLog({
          actorEmail: email,
          actorRole: "UNAUTHENTICATED",
          action: "auth.login_failed",
          entityType: "admin_user",
          summary: `Failed login attempt for ${email}`,
          ipAddress: req.ip,
        });
        return reply.code(401).send({ error: "Invalid email or password." });
      }

      const valid = await argon2.verify(user.password_hash, parsed.data.password).catch(() => false);
      if (!valid) {
        await writeAuditLog({
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role_code,
          action: "auth.login_failed",
          entityType: "admin_user",
          entityId: user.id,
          summary: `Invalid password entered for ${user.email}`,
          ipAddress: req.ip,
        });
        return reply.code(401).send({ error: "Invalid email or password." });
      }

      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const csrfToken = generateSecureToken(24);
      const expiresAt = new Date(Date.now() + config.sessionTtlHours * 3600 * 1000).toISOString();
      const ts = nowIso();

      await db.run(
        `INSERT INTO admin_sessions (user_id, token_hash, csrf_token, ip_address, user_agent, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, tokenHash, csrfToken, req.ip, String(req.headers["user-agent"] || "").slice(0, 250), expiresAt, ts]
      );
      await db.run("UPDATE admin_users SET last_login_at = $1, updated_at = $1 WHERE id = $2", [ts, user.id]);

      const perms = await db.all<{ code: string }>(
        `SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = $1`,
        [user.role_id]
      );

      reply.setCookie(SESSION_COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: config.cookieSecure,
        sameSite: "lax",
        path: "/",
        domain: config.cookieDomain,
        expires: new Date(expiresAt),
      });

      await writeAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role_code,
        action: "auth.login",
        entityType: "admin_user",
        entityId: user.id,
        summary: `Administrator ${user.email} signed in`,
        ipAddress: req.ip,
      });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          roleCode: user.role_code,
          roleName: user.role_name,
          permissions: perms.map((p) => p.code),
        },
        csrfToken,
        expiresAt,
      });
    }
  );

  app.get("/api/auth/me", async (req, reply) => {
    const admin = await loadAdminFromRequest(req);
    if (!admin) {
      return reply.code(401).send({ error: "Not authenticated." });
    }
    return reply.send({
      user: {
        id: admin.userId,
        email: admin.email,
        fullName: admin.fullName,
        roleCode: admin.roleCode,
        roleName: admin.roleName,
        permissions: admin.permissions,
      },
      csrfToken: admin.csrfToken,
    });
  });

  app.post("/api/auth/logout", { preHandler: requireAuth() }, async (req, reply) => {
    const admin = req.admin!;
    const db = getDb();
    await db.run("DELETE FROM admin_sessions WHERE id = $1", [admin.sessionId]);
    reply.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "lax",
      path: "/",
      domain: config.cookieDomain,
    });
    await writeAuditLog({
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorRole: admin.roleCode,
      action: "auth.logout",
      entityType: "admin_session",
      entityId: admin.sessionId,
      summary: `Administrator ${admin.email} signed out`,
      ipAddress: req.ip,
    });
    return reply.send({ ok: true });
  });

  app.post(
    "/api/auth/forgot-password",
    {
      config: {
        rateLimit: { max: 5, timeWindow: "15 minutes" },
      },
    },
    async (req, reply) => {
      const parsed = forgotSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Valid email is required." });
      }
      const db = getDb();
      const email = parsed.data.email.trim().toLowerCase();
      const user = await db.get<{ id: number; email: string; is_active: number }>(
        "SELECT id, email, is_active FROM admin_users WHERE email = $1",
        [email]
      );

      if (user && user.is_active) {
        const rawReset = generateSecureToken(32);
        const tokenHash = hashToken(rawReset);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await db.run(
          "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, $4)",
          [user.id, tokenHash, expiresAt, nowIso()]
        );
        const resetUrl = `${config.adminPortalUrl}/?resetToken=${rawReset}`;
        await sendPasswordResetEmail({ to: user.email, resetUrl });
        await writeAuditLog({
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: "USER",
          action: "auth.password_reset_requested",
          entityType: "admin_user",
          entityId: user.id,
          summary: `Password reset requested for ${user.email}`,
          ipAddress: req.ip,
        });
      }

      // Generic response prevents account enumeration
      return reply.send({
        message: "If an active administrator account matches that email, a password reset link has been generated.",
      });
    }
  );

  app.post(
    "/api/auth/reset-password",
    {
      config: {
        rateLimit: { max: 10, timeWindow: "15 minutes" },
      },
    },
    async (req, reply) => {
      const parsed = resetSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message || "Invalid reset request." });
      }

      const db = getDb();
      const tokenHash = hashToken(parsed.data.token);
      const row = await db.get<{ id: number; user_id: number; expires_at: string; used_at: string | null }>(
        "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1",
        [tokenHash]
      );
      if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) {
        return reply.code(400).send({ error: "Reset token is invalid or has expired." });
      }

      const passwordHash = await argon2.hash(parsed.data.newPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });
      const ts = nowIso();
      await db.run("UPDATE admin_users SET password_hash = $1, updated_at = $2 WHERE id = $3", [
        passwordHash,
        ts,
        row.user_id,
      ]);
      await db.run("UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2", [ts, row.id]);
      // Revoke all active sessions after password reset
      await db.run("DELETE FROM admin_sessions WHERE user_id = $1", [row.user_id]);

      const user = await db.get<{ email: string }>("SELECT email FROM admin_users WHERE id = $1", [row.user_id]);
      await writeAuditLog({
        actorUserId: row.user_id,
        actorEmail: user?.email || "unknown",
        actorRole: "USER",
        action: "auth.password_reset_completed",
        entityType: "admin_user",
        entityId: row.user_id,
        summary: `Password reset completed and active sessions revoked for ${user?.email || row.user_id}`,
        ipAddress: req.ip,
      });

      return reply.send({ ok: true, message: "Password updated successfully. Please sign in." });
    }
  );
}
