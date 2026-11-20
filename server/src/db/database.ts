import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";
import { config } from "../config.js";

export type SqlParam = string | number | null | Uint8Array;

export interface DbClient {
  kind: "sqlite" | "postgres";
  all<T = Record<string, unknown>>(sql: string, params?: SqlParam[]): Promise<T[]>;
  get<T = Record<string, unknown>>(sql: string, params?: SqlParam[]): Promise<T | undefined>;
  run(sql: string, params?: SqlParam[]): Promise<{ lastInsertRowid: number; changes: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

function toSqliteParams(sql: string, params: SqlParam[] = []): { sql: string; params: SqlParam[] } {
  const ordered: SqlParam[] = [];
  const converted = sql.replace(/\$(\d+)/g, (_, idxStr) => {
    const idx = Number(idxStr) - 1;
    ordered.push(params[idx] ?? null);
    return "?";
  });
  return { sql: converted, params: ordered.length > 0 ? ordered : params };
}

class SqliteAdapter implements DbClient {
  kind: "sqlite" = "sqlite";
  private db: DatabaseSync;

  constructor(filePath: string) {
    if (filePath !== ":memory:") {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    this.db = new DatabaseSync(filePath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA busy_timeout = 5000;");
  }

  async all<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const q = toSqliteParams(sql, params);
    const stmt = this.db.prepare(q.sql);
    return stmt.all(...q.params) as unknown as T[];
  }

  async get<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T | undefined> {
    const q = toSqliteParams(sql, params);
    const stmt = this.db.prepare(q.sql);
    return stmt.get(...q.params) as unknown as T | undefined;
  }

  async run(sql: string, params: SqlParam[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
    const q = toSqliteParams(sql, params);
    const stmt = this.db.prepare(q.sql);
    const res = stmt.run(...q.params);
    return {
      lastInsertRowid: Number(res.lastInsertRowid ?? 0),
      changes: Number(res.changes ?? 0),
    };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

class PostgresAdapter implements DbClient {
  kind: "postgres" = "postgres";
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async all<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const res = await this.pool.query(sql, params);
    return res.rows as T[];
  }

  async get<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T | undefined> {
    const res = await this.pool.query(sql, params);
    return res.rows[0] as T | undefined;
  }

  async run(sql: string, params: SqlParam[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
    const isInsert = /^\s*INSERT\s+/i.test(sql) && !/\bRETURNING\b/i.test(sql);
    const finalSql = isInsert ? `${sql.trim().replace(/;$/, "")} RETURNING id` : sql;
    try {
      const res = await this.pool.query(finalSql, params);
      const id = res.rows[0]?.id ? Number(res.rows[0].id) : 0;
      return { lastInsertRowid: id, changes: res.rowCount ?? 0 };
    } catch (err) {
      // Fallback for INSERTs into join tables without an `id` column
      if (isInsert) {
        const res = await this.pool.query(sql, params);
        return { lastInsertRowid: 0, changes: res.rowCount ?? 0 };
      }
      throw err;
    }
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let singleton: DbClient | null = null;

export function createDb(overrideSqlitePath?: string): DbClient {
  if (!overrideSqlitePath && config.dbClient === "postgres") {
    if (!config.databaseUrl) {
      throw new Error("DB_CLIENT=postgres requires DATABASE_URL to be set.");
    }
    return new PostgresAdapter(config.databaseUrl);
  }
  return new SqliteAdapter(overrideSqlitePath || config.sqlitePath);
}

export function getDb(): DbClient {
  if (!singleton) {
    singleton = createDb();
  }
  return singleton;
}

export function setDbForTesting(db: DbClient) {
  singleton = db;
}

export function nowIso(): string {
  return new Date().toISOString();
}
