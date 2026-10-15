/** Leitura e gravação das sextas. Sem regra de negócio. */
import { asc, eq, gte, inArray } from 'drizzle-orm';
import { db } from '../../banco/cliente.js';
import { confirmacoes, dias, tarefas, type Dia, type DiaComTudo } from '../../banco/esquema.js';
import type { Executor } from '../../banco/transacao.js';

/** Junta a cada sexta as pessoas (em ordem de confirmação) e as tarefas (em ordem). */
async function completar(lista: Dia[], banco: Executor = db): Promise<DiaComTudo[]> {
  if (lista.length === 0) return [];
  const ids = lista.map((dia) => dia.id);
  const [pessoas, listaDeTarefas] = await Promise.all([
    banco
      .select()
      .from(confirmacoes)
      .where(inArray(confirmacoes.diaId, ids))
      .orderBy(asc(confirmacoes.criadoEm), asc(confirmacoes.id)),
    banco
      .select()
      .from(tarefas)
      .where(inArray(tarefas.diaId, ids))
      .orderBy(asc(tarefas.ordem), asc(tarefas.criadoEm)),
  ]);
  return lista.map((dia) => ({
    ...dia,
    pessoas: pessoas.filter((pessoa) => pessoa.diaId === dia.id),
    tarefas: listaDeTarefas.filter((tarefa) => tarefa.diaId === dia.id),
  }));
}

/** Sextas da data informada em diante, em ordem de data. */
export async function listarAPartirDe(data: string, limite?: number): Promise<DiaComTudo[]> {
  const consulta = db.select().from(dias).where(gte(dias.data, data)).orderBy(asc(dias.data));
  return completar(limite === undefined ? await consulta : await consulta.limit(limite));
}

export async function buscarCompleto(id: string): Promise<DiaComTudo | undefined> {
  const dia = await buscar(id);
  return dia ? (await completar([dia]))[0] : undefined;
}

/** Só a linha da sexta, sem pessoas e tarefas. */
export async function buscar(id: string, banco: Executor = db): Promise<Dia | undefined> {
  const [dia] = await banco.select().from(dias).where(eq(dias.id, id));
  return dia;
}

/**
 * Busca a sexta TRAVANDO a linha até o fim da transação (SELECT … FOR UPDATE).
 * Quem chegar depois espera: é assim que só uma pessoa leva a última vaga (C5).
 */
export async function buscarTravando(tx: Executor, id: string): Promise<Dia | undefined> {
  const [dia] = await tx.select().from(dias).where(eq(dias.id, id)).for('update');
  return dia;
}
