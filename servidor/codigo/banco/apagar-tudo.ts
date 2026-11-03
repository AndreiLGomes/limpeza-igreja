/**
 * Apaga todos os dados das tabelas do aplicativo (não apaga as tabelas).
 * Usado pelo seed (só desenvolvimento) e pelo limparBanco() dos testes. NUNCA em produção.
 */
import { getTableName, sql } from 'drizzle-orm';
import type { Banco } from './cliente.js';
import { cabecalhoPadrao, confirmacoes, dias, sessoesOrganizador, tarefas, tentativasDeAcesso } from './esquema.js';

const TABELAS = [confirmacoes, tarefas, dias, sessoesOrganizador, tentativasDeAcesso, cabecalhoPadrao]
  .map((tabela) => `"${getTableName(tabela)}"`)
  .join(', ');

export async function apagarTudo(banco: Pick<Banco, 'execute'>): Promise<void> {
  await banco.execute(sql.raw(`TRUNCATE ${TABELAS} CASCADE`));
}
