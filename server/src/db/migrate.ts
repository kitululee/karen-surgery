import fs from "node:fs";
import path from "node:path";
import { SERVER_ROOT } from "../config.js";
import { type DbClient, getDb } from "./database.js";

export async function runMigrations(db: DbClient = getDb()) {
  const migrationsDir = path.join(SERVER_ROOT, "migrations");
  const suffix = db.kind === "postgres" ? ".postgres.sql" : ".sqlite.sql";
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(suffix))
    .sort();

  // Ensure schema_migrations table exists first
  await db.exec(
    db.kind === "postgres"
      ? `CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`
      : `CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')));`
  );

  for (const file of files) {
    const version = file.replace(suffix, "");
    const existing = await db.get<{ version: string }>(
      "SELECT version FROM schema_migrations WHERE version = $1",
      [version]
    );
    if (existing) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await db.exec(sql);
    await db.run("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
    console.log(`[db] Applied migration: ${file}`);
  }
}

// Run when invoked directly via `npm run migrate`
if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations()
    .then(async () => {
      await getDb().close();
      console.log("[db] Migrations complete.");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
