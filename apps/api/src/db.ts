import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}

/** 운영은 PostgreSQL, 로컬·테스트는 같은 SQL이 도는 PGlite를 씁니다. */
export async function createDb(options: { databaseUrl?: string; dataDir?: string }): Promise<Db> {
  if (options.databaseUrl) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: options.databaseUrl });
    return {
      query: async <T>(sql: string, params: unknown[] = []) =>
        (await pool.query(sql, params)).rows as T[],
      close: () => pool.end(),
    };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const client = await PGlite.create(options.dataDir);
  return {
    query: async <T>(sql: string, params: unknown[] = []) =>
      (await client.query<T>(sql, params)).rows,
    close: () => client.close(),
  };
}

const migrationsDir = fileURLToPath(new URL('../migrations', import.meta.url));

/** 아직 적용되지 않은 migrations/*.sql을 이름 순서대로 적용합니다. */
export async function migrate(db: Db): Promise<void> {
  await db.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const applied = new Set(
    (await db.query<{ name: string }>('SELECT name FROM schema_migrations')).map((r) => r.name),
  );
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    for (const statement of sql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
      await db.query(statement);
    }
    await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
  }
}
