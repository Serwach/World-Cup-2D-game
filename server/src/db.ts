import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

let db: Database.Database | null = null;

function dbFilePath(): string {
  if (process.env.DB_FILE) return path.resolve(process.env.DB_FILE);
  // Default: <project>/db/worldcup2026.sqlite (works from both src and dist).
  return path.join(__dirname, '../../db/worldcup2026.sqlite');
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbFilePath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export async function runMigrations(): Promise<void> {
  const database = getDb();
  const schemaPath = path.join(__dirname, '../../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  database.exec(schema);
  console.log('[DB] Migrations applied.');
}

export async function checkAndSeed(): Promise<void> {
  const rows = await query<{ cnt: number }>('SELECT COUNT(*) as cnt FROM teams');
  const count = rows[0].cnt;
  if (count > 0) {
    console.log(`[DB] Already seeded (${count} teams found).`);
    return;
  }

  console.log('[DB] Seeding database...');
  const { seed } = await import('./seeder');
  await seed();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const stmt = getDb().prepare(sql);
  return stmt.all(...params) as T[];
}

export interface ExecuteResult {
  insertId: number;
  affectedRows: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute(sql: string, params: any[] = []): Promise<ExecuteResult> {
  const info = getDb().prepare(sql).run(...params);
  return { insertId: Number(info.lastInsertRowid), affectedRows: info.changes };
}
