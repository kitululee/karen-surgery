import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, "..");

// Load .env file if present without overriding real process.env variables
function loadEnvFile() {
  const envPath = path.join(SERVER_ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadEnvFile();

const isProd = process.env.NODE_ENV === "production";
const rawCookieSecret = process.env.COOKIE_SECRET || "";
if (isProd && (!rawCookieSecret || rawCookieSecret.startsWith("change-me") || rawCookieSecret.length < 32)) {
  throw new Error("COOKIE_SECRET must be set to a 32+ character random secret in production.");
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd,
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || "127.0.0.1",
  dbClient: (process.env.DB_CLIENT || "sqlite").toLowerCase() as "sqlite" | "postgres",
  sqlitePath: path.resolve(SERVER_ROOT, process.env.SQLITE_PATH || "./data/karen-surgery.db"),
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigins: (
    process.env.CORS_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5173,http://127.0.0.1:5173,https://kitululee.github.io,https://www.karensurgery.com,https://admin.karensurgery.com"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  adminPortalUrl: process.env.ADMIN_PORTAL_URL || "http://localhost:5173",
  publicApiUrl: process.env.PUBLIC_API_URL || "http://localhost:4000",
  cookieSecret: rawCookieSecret || crypto.randomBytes(32).toString("hex"),
  cookieSecure: process.env.COOKIE_SECURE === "true" || isProd,
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 8),
  uploadDir: path.resolve(SERVER_ROOT, process.env.UPLOAD_DIR || "./uploads"),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024,
  dataRetentionDays: Number(process.env.DATA_RETENTION_DAYS || 365),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Karen Surgery Website <no-reply@karensurgery.com>",
  },
  receptionEmail: process.env.RECEPTION_EMAIL || "Receptionist@KarenSurgery.com",
};
