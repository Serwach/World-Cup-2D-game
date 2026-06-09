import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'worldcup2026',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function runMigrations(): Promise<void> {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schema);
    console.log('[DB] Migrations applied.');
  } finally {
    await conn.end();
  }
}

export async function checkAndSeed(): Promise<void> {
  const db = getPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) as cnt FROM teams'
  );
  const count = rows[0].cnt as number;
  if (count > 0) {
    console.log(`[DB] Already seeded (${count} teams found).`);
    return;
  }

  console.log('[DB] Seeding database...');
  const { seed } = await import('./seeder');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'worldcup2026',
    multipleStatements: true,
  });
  try {
    await seed(conn);
  } finally {
    await conn.end();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T extends mysql.RowDataPacket[]>(sql: string, params?: any[]): Promise<T> {
  const db = getPool();
  const [rows] = await db.execute<T>(sql, params);
  return rows;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const db = getPool();
  const [result] = await db.execute<mysql.ResultSetHeader>(sql, params);
  return result;
}
