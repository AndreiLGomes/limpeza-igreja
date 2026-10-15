/**
 * Aplica as migrações de src/banco/migracoes num banco. Usado pelo comando "npm run migrar"
 * e pela preparação do banco de teste.
 */
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

/** Funciona tanto rodando de src/banco (tsx) quanto de dist/banco (build): os dois ficam em backend/. */
const PASTA_DAS_MIGRACOES = fileURLToPath(new URL('../../src/banco/migracoes', import.meta.url));

export async function aplicarMigracoes(urlDoBanco: string): Promise<void> {
  const pool = new pg.Pool({ connectionString: urlDoBanco, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: PASTA_DAS_MIGRACOES });
  } finally {
    await pool.end();
  }
}
