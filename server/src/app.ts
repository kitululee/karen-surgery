import fs from "node:fs";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { config } from "./config.js";
import { type DbClient, getDb } from "./db/database.js";
import { seedDatabase } from "./db/seed.js";
import { authRoutes } from "./routes/auth.js";
import { publicRoutes } from "./routes/public.js";
import { adminOpsRoutes } from "./routes/admin-ops.js";
import { adminCmsRoutes } from "./routes/admin-cms.js";
import { adminSystemRoutes } from "./routes/admin-system.js";

export async function buildApp(opts?: { db?: DbClient; logger?: boolean }) {
  const db = opts?.db || getDb();
  await seedDatabase(db);

  fs.mkdirSync(config.uploadDir, { recursive: true });

  const app = Fastify({
    logger: opts?.logger ?? !config.isProd,
    trustProxy: true,
  });

  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  });

  await app.register(cookie, {
    secret: config.cookieSecret,
  });

  await app.register(rateLimit, {
    global: false,
  });

  await app.register(multipart, {
    limits: {
      fileSize: config.maxUploadBytes,
      files: 1,
    },
  });

  await app.register(fastifyStatic, {
    root: config.uploadDir,
    prefix: "/uploads/",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  });

  await app.register(authRoutes);
  await app.register(publicRoutes);
  await app.register(adminOpsRoutes);
  await app.register(adminCmsRoutes);
  await app.register(adminSystemRoutes);

  return app;
}
