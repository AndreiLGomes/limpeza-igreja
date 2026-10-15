/** Leitura e gravação das confirmações de presença. Sem regra de negócio. */
import { and, count, eq } from 'drizzle-orm';
import { db } from '../../banco/cliente.js';
import { confirmacoes, dias, type Confirmacao } from '../../banco/esquema.js';
import type { Executor } from '../../banco/transacao.js';

export async function contarDoDia(banco: Executor, diaId: string): Promise<number> {
  const [linha] = await banco.select({ total: count() }).from(confirmacoes).where(eq(confirmacoes.diaId, diaId));
  return linha?.total ?? 0;
}

export async function telefoneJaConfirmado(banco: Executor, diaId: string, telefone: string): Promise<boolean> {
  const achadas = await banco
    .select({ id: confirmacoes.id })
    .from(confirmacoes)
    .where(and(eq(confirmacoes.diaId, diaId), eq(confirmacoes.telefone, telefone)))
    .limit(1);
  return achadas.length > 0;
}

export async function inserir(banco: Executor, valores: typeof confirmacoes.$inferInsert): Promise<Confirmacao> {
  const [criada] = await banco.insert(confirmacoes).values(valores).returning();
  if (!criada) throw new Error('A confirmação não foi gravada.');
  return criada;
}

/** A confirmação dona do código (pelo hash), com a data da sexta. */
export async function buscarPorCodigo(codigoHash: string): Promise<{ id: string; data: string } | undefined> {
  const [achada] = await db
    .select({ id: confirmacoes.id, data: dias.data })
    .from(confirmacoes)
    .innerJoin(dias, eq(dias.id, confirmacoes.diaId))
    .where(eq(confirmacoes.codigoCancelamentoHash, codigoHash));
  return achada;
}

export async function apagar(id: string): Promise<void> {
  await db.delete(confirmacoes).where(eq(confirmacoes.id, id));
}

/** Apaga a confirmação desse telefone nessa sexta. Devolve se havia alguma. */
export async function apagarPorTelefone(diaId: string, telefone: string): Promise<boolean> {
  const apagadas = await db
    .delete(confirmacoes)
    .where(and(eq(confirmacoes.diaId, diaId), eq(confirmacoes.telefone, telefone)))
    .returning({ id: confirmacoes.id });
  return apagadas.length > 0;
}
