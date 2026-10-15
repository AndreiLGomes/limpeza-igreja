/**
 * Roda uma vez antes de todos os testes: recria do zero o banco de TESTE e aplica as migrações.
 * Assim os testes sempre começam com as tabelas e restrições da versão atual (docs/07-testes.md).
 */
import './ambiente.js';
import pg from 'pg';

export default async function prepararBancoDeTeste() {
  const { config } = await import('../../src/config.js');
  const { aplicarMigracoes } = await import('../../src/banco/aplicar-migracoes.js');

  // Trava de segurança: só apaga um banco cujo nome termine em "_teste".
  const nomeDoBanco = new URL(config.urlDoBanco).pathname.slice(1);
  if (!nomeDoBanco.endsWith('_teste')) {
    throw new Error(`Os testes só rodam num banco com nome terminado em "_teste" (veio "${nomeDoBanco}").`);
  }

  const cliente = new pg.Client({ connectionString: config.urlDoBanco });
  await cliente.connect();
  try {
    await cliente.query('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE;');
    await cliente.query('CREATE SCHEMA public;');
  } finally {
    await cliente.end();
  }
  await aplicarMigracoes(config.urlDoBanco);
}
