import { type DbClient, getDb, nowIso } from "../db/database.js";

export interface AuditEntryInput {
  actorUserId?: number | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAuditLog(entry: AuditEntryInput, db: DbClient = getDb()) {
  await db.run(
    `INSERT INTO audit_logs (
      actor_user_id, actor_email, actor_role, action, entity_type, entity_id, summary, metadata_json, ip_address, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      entry.actorUserId ?? null,
      entry.actorEmail,
      entry.actorRole,
      entry.action,
      entry.entityType,
      String(entry.entityId ?? ""),
      entry.summary,
      JSON.stringify(entry.metadata ?? {}),
      entry.ipAddress ?? "",
      nowIso(),
    ]
  );
}
