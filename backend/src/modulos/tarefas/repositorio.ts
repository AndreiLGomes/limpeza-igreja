/** Leitura e gravação das tarefas. Sem regra de negócio. */
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../banco/cliente.js';
import { dias, tarefas, type TarefaDoBanco } from '../../banco/esquema.js';
import type { Executor } from '../../banco/transacao.js';

/** A tarefa daquela sexta, com a data da sexta. */
export async function buscarComData(
  diaId: string,
  tarefaId: string,
): Promise<{ id: string; data: string } | undefined> {
  const [achada] = await db
    .select({ id: tarefas.id, data: dias.data })
    .from(tarefas)
    .innerJoin(dias, eq(dias.id, tarefas.diaId))
    .where(and(eq(tarefas.id, tarefaId), eq(tarefas.diaId, diaId)));
  return achada;
}

export async function marcar(id: string, feita: boolean): Promise<TarefaDoBanco> {
  const [tarefa] = await db
    .update(tarefas)
    .set({ feita, feitaEm: feita ? sql`now()` : null })
    .where(eq(tarefas.id, id))
    .returning();
  if (!tarefa) throw new Error('A tarefa não foi atualizada.');
  return tarefa;
}

export function listarIdsDoDia(tx: Executor, diaId: string): Promise<{ id: string }[]> {
  return tx.select({ id: tarefas.id }).from(tarefas).where(eq(tarefas.diaId, diaId));
}

export async function inserirVarias(tx: Executor, diaId: string, novas: { nome: string; ordem: number }[]) {
  if (novas.length > 0) await tx.insert(tarefas).values(novas.map((tarefa) => ({ ...tarefa, diaId })));
}

export async function apagarVarias(tx: Executor, ids: string[]) {
  if (ids.length > 0) await tx.delete(tarefas).where(inArray(tarefas.id, ids));
}

/**
 * Renomeia e reordena tarefas que já existem, sem mexer em "feita" (S9).
 * Primeiro troca cada nome por um provisório único (o próprio id), para trocas como
 * "A"↔"B" não esbarrarem na restrição de nome único da sexta no meio do caminho.
 */
export async function renomearVarias(tx: Executor, mantidas: { id: string; nome: string; ordem: number }[]) {
  if (mantidas.length === 0) return;
  await tx
    .update(tarefas)
    .set({ nome: sql`${tarefas.id}::text` })
    .where(inArray(tarefas.id, mantidas.map((tarefa) => tarefa.id)));
  for (const { id, nome, ordem } of mantidas) {
    await tx.update(tarefas).set({ nome, ordem }).where(eq(tarefas.id, id));
  }
}
