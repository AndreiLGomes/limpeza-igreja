/** Leitura e gravação das limpezas. Sem regra de negócio. */
import { asc, desc, eq, gte, inArray } from 'drizzle-orm';
import { bd } from '../../banco/cliente.js';
import { confirmacoes, dias, tarefas, type Dia, type DiaComTudo } from '../../banco/esquema.js';
import type { Executor } from '../../banco/transacao.js';

/** Junta a cada limpeza as pessoas (em ordem de confirmação) e as tarefas (em ordem). */
async function completar(lista: Dia[], banco: Executor = bd): Promise<DiaComTudo[]> {
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

/** Limpezas da data informada em diante, em ordem de data. */
export async function listarAPartirDe(data: string, limite?: number): Promise<DiaComTudo[]> {
  const consulta = bd.select().from(dias).where(gte(dias.data, data)).orderBy(asc(dias.data));
  return completar(limite === undefined ? await consulta : await consulta.limit(limite));
}

export async function buscarCompleto(id: string): Promise<DiaComTudo | undefined> {
  const dia = await buscar(id);
  return dia ? (await completar([dia]))[0] : undefined;
}

/** Só a linha da limpeza, sem pessoas e tarefas. */
export async function buscar(id: string, banco: Executor = bd): Promise<Dia | undefined> {
  const [dia] = await banco.select().from(dias).where(eq(dias.id, id));
  return dia;
}

/** A limpeza de data mais recente (passada ou não), com as tarefas. */
export async function buscarMaisRecente(): Promise<DiaComTudo | undefined> {
  const [dia] = await bd.select().from(dias).orderBy(desc(dias.data)).limit(1);
  return dia ? (await completar([dia]))[0] : undefined;
}

type CamposDaLimpeza = Pick<typeof dias.$inferInsert, 'data' | 'inicio' | 'fim' | 'vagas'>;

export async function inserir(tx: Executor, valores: CamposDaLimpeza): Promise<Dia> {
  const [dia] = await tx.insert(dias).values(valores).returning();
  if (!dia) throw new Error('A limpeza não foi gravada.');
  return dia;
}

export async function atualizar(tx: Executor, id: string, valores: CamposDaLimpeza): Promise<void> {
  await tx.update(dias).set(valores).where(eq(dias.id, id));
}

/** Apaga a limpeza (as confirmações e tarefas vão junto, pelo CASCADE). Devolve se ela existia. */
export async function apagar(id: string): Promise<boolean> {
  const apagados = await bd.delete(dias).where(eq(dias.id, id)).returning({ id: dias.id });
  return apagados.length > 0;
}

/**
 * Busca a limpeza TRAVANDO a linha até o fim da transação (SELECT … FOR UPDATE).
 * Quem chegar depois espera: é assim que só uma pessoa leva a última vaga (C5).
 */
export async function buscarTravando(tx: Executor, id: string): Promise<Dia | undefined> {
  const [dia] = await tx.select().from(dias).where(eq(dias.id, id)).for('update');
  return dia;
}
