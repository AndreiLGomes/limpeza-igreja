/** Uma conexão (pool) para o app inteiro. Conecta só quando a primeira consulta acontece. */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import * as esquema from './esquema.js';

export const pool = new pg.Pool({ connectionString: config.urlDoBanco });

export const db = drizzle(pool, { schema: esquema });

export type Banco = typeof db;

/** Fecha as conexões (fim dos comandos e dos testes). */
export async function fecharBanco(): Promise<void> {
  await pool.end();
}
