import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/**
 * Conexão única com o SQLite.
 *
 * Em dev o Next recarrega módulos a cada edição; sem o cache global abriríamos
 * um handle novo do banco a cada hot reload até estourar.
 */

const DB_PATH = process.env.CSYSTEM_DB_PATH ?? "./data/csystem.db";

function createConnection() {
  const absolute = path.resolve(process.cwd(), DB_PATH);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });

  const sqlite = new Database(absolute);
  // WAL: leitura não bloqueia escrita — o webhook do SDR pode chegar enquanto
  // o Alex arrasta um card.
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  return drizzle(sqlite, { schema });
}

type DB = ReturnType<typeof createConnection>;

const globalForDb = globalThis as unknown as { __csystemDb?: DB };

export const db: DB = globalForDb.__csystemDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__csystemDb = db;
}

export { schema };
export const dbPath = DB_PATH;
