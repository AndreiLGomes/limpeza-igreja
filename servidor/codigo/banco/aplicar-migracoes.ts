/**
 * Aplica as migrações de codigo/banco/migracoes num banco. Usado pelo comando "npm run migrar"
 * e pela preparação do banco de teste.
 */
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

/** Funciona tanto rodando de codigo/banco (tsx) quanto de compilado/banco (build): os dois ficam em servidor/. */
const PASTA_DAS_MIGRACOES = fileURLToPath(new URL('../../codigo/banco/migracoes', import.meta.url));

export async function aplicarMigracoes(urlDoBanco: string): Promise<void> {
  const conexoes = new pg.Pool({ connectionString: urlDoBanco, max: 1 });
  try {
    await migrate(drizzle(conexoes), { migrationsFolder: PASTA_DAS_MIGRACOES });
  } finally {
    await conexoes.end();
  }
}
