/** Leitura e gravação das tarefas. Sem regra de negócio. */
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../banco/cliente.js';
import { dias, tarefas, type TarefaDoBanco } from '../../banco/esquema.js';

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
