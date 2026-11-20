import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import argon2 from "argon2";
import { getDb, nowIso } from "../db/database.js";
import { runMigrations } from "../db/migrate.js";
import { seedDatabase } from "../db/seed.js";

/**
 * Secure first-administrator provisioning procedure.
 * Never hardcodes passwords. Reads from env vars (for automated VM setup) or prompts interactively.
 */
async function main() {
  const db = getDb();
  await runMigrations(db);
  await seedDatabase(db);

  let email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  let fullName = (process.env.ADMIN_NAME || "").trim();
  let password = process.env.ADMIN_PASSWORD || "";

  if (!email || !fullName || !password) {
    const rl = readline.createInterface({ input, output });
    try {
      if (!email) email = (await rl.question("Super Admin Email: ")).trim().toLowerCase();
      if (!fullName) fullName = (await rl.question("Full Name: ")).trim();
      if (!password) password = await rl.question("Strong Password (min 12 chars): ");
    } finally {
      rl.close();
    }
  }

  if (!email.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  if (fullName.length < 2) {
    throw new Error("Full name must be at least 2 characters.");
  }
  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters long.");
  }

  const role = await db.get<{ id: number }>("SELECT id FROM roles WHERE code = $1", ["SUPER_ADMIN"]);
  if (!role) throw new Error("SUPER_ADMIN role not found. Run seed first.");

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const existing = await db.get<{ id: number }>("SELECT id FROM admin_users WHERE email = $1", [email]);
  const ts = nowIso();

  if (existing) {
    await db.run(
      "UPDATE admin_users SET full_name = $1, password_hash = $2, role_id = $3, is_active = 1, updated_at = $4 WHERE id = $5",
      [fullName, passwordHash, role.id, ts, existing.id]
    );
    await db.run(
      `INSERT INTO audit_logs (actor_user_id, actor_email, actor_role, action, entity_type, entity_id, summary, metadata_json, ip_address, created_at)
       VALUES ($1, $2, 'SUPER_ADMIN', 'cli.update_super_admin', 'admin_user', $3, $4, '{}', 'local-cli', $5)`,
      [existing.id, email, String(existing.id), `Updated SUPER_ADMIN account ${email} via provisioning CLI`, ts]
    );
    console.log(`Updated SUPER_ADMIN user: ${email} (id=${existing.id})`);
  } else {
    const res = await db.run(
      `INSERT INTO admin_users (email, full_name, password_hash, role_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 1, $5, $5)`,
      [email, fullName, passwordHash, role.id, ts]
    );
    await db.run(
      `INSERT INTO audit_logs (actor_user_id, actor_email, actor_role, action, entity_type, entity_id, summary, metadata_json, ip_address, created_at)
       VALUES ($1, $2, 'SUPER_ADMIN', 'cli.provision_super_admin', 'admin_user', $3, $4, '{}', 'local-cli', $5)`,
      [res.lastInsertRowid, email, String(res.lastInsertRowid), `Provisioned initial SUPER_ADMIN account ${email} via CLI`, ts]
    );
    console.log(`Provisioned SUPER_ADMIN user: ${email} (id=${res.lastInsertRowid})`);
  }

  await db.close();
}

main().catch((err) => {
  console.error("Provisioning failed:", err.message || err);
  process.exit(1);
});
