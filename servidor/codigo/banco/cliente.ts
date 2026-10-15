/** Um conjunto de conexões (pool) para o aplicativo inteiro. Conecta só quando a primeira consulta acontece. */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { configuracao } from '../configuracao.js';
import * as esquema from './esquema.js';

export const conexoes = new pg.Pool({ connectionString: configuracao.urlDoBanco });

export const bd = drizzle(conexoes, { schema: esquema });

export type Banco = typeof bd;

/** Fecha as conexões (fim dos comandos e dos testes). */
export async function fecharBanco(): Promise<void> {
  await conexoes.end();
}
