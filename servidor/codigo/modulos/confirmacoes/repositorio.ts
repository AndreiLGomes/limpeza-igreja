/** Leitura e gravação das confirmações de presença. Sem regra de negócio. */
import { and, count, eq, isNotNull, isNull } from 'drizzle-orm';
import { bd } from '../../banco/cliente.js';
import { confirmacoes, dias, type Confirmacao } from '../../banco/esquema.js';
import type { Executor } from '../../banco/transacao.js';

export async function contarDoDia(banco: Executor, diaId: string): Promise<number> {
  const [linha] = await banco.select({ total: count() }).from(confirmacoes).where(eq(confirmacoes.diaId, diaId));
  return linha?.total ?? 0;
}

/** A confirmação desse telefone nessa limpeza, se houver (C4, X2, L2). */
export async function buscarPorTelefone(
  banco: Executor,
  diaId: string,
  telefone: string,
): Promise<Confirmacao | undefined> {
  const [achada] = await banco
    .select()
    .from(confirmacoes)
    .where(and(eq(confirmacoes.diaId, diaId), eq(confirmacoes.telefone, telefone)))
    .limit(1);
  return achada;
}

export async function inserir(banco: Executor, valores: typeof confirmacoes.$inferInsert): Promise<Confirmacao> {
  const [criada] = await banco.insert(confirmacoes).values(valores).returning();
  if (!criada) throw new Error('A confirmação não foi gravada.');
  return criada;
}

/** A confirmação dona do código (pelo hash), com a data da limpeza. */
export async function buscarPorCodigo(codigoHash: string): Promise<{ id: string; data: string } | undefined> {
  const [achada] = await bd
    .select({ id: confirmacoes.id, data: dias.data })
    .from(confirmacoes)
    .innerJoin(dias, eq(dias.id, confirmacoes.diaId))
    .where(eq(confirmacoes.codigoCancelamentoHash, codigoHash));
  return achada;
}

export async function apagar(id: string): Promise<void> {
  await bd.delete(confirmacoes).where(eq(confirmacoes.id, id));
}

/** Apaga a pessoa daquela limpeza e devolve os dados dela (para o "Desfazer", O5). */
export async function apagarDoDia(diaId: string, pessoaId: string): Promise<Confirmacao | undefined> {
  const [apagada] = await bd
    .delete(confirmacoes)
    .where(and(eq(confirmacoes.id, pessoaId), eq(confirmacoes.diaId, diaId)))
    .returning();
  return apagada;
}

/** Apaga a confirmação desse telefone nessa limpeza. Devolve se havia alguma. */
export async function apagarPorTelefone(diaId: string, telefone: string): Promise<boolean> {
  const apagadas = await bd
    .delete(confirmacoes)
    .where(and(eq(confirmacoes.diaId, diaId), eq(confirmacoes.telefone, telefone)))
    .returning({ id: confirmacoes.id });
  return apagadas.length > 0;
}

/** A pessoa daquela limpeza pelo id (L8). */
export async function buscarDoDia(banco: Executor, diaId: string, pessoaId: string): Promise<Confirmacao | undefined> {
  const [achada] = await banco
    .select()
    .from(confirmacoes)
    .where(and(eq(confirmacoes.id, pessoaId), eq(confirmacoes.diaId, diaId)));
  return achada;
}

export async function atualizar(
  banco: Executor,
  id: string,
  valores: Partial<typeof confirmacoes.$inferInsert>,
): Promise<Confirmacao> {
  const [atualizada] = await banco.update(confirmacoes).set(valores).where(eq(confirmacoes.id, id)).returning();
  if (!atualizada) throw new Error('A confirmação não foi atualizada.');
  return atualizada;
}

/** L13: quem marcou entrada e ainda não saiu, naquela limpeza. */
export function semSaida(banco: Executor, diaId: string): Promise<Confirmacao[]> {
  return banco
    .select()
    .from(confirmacoes)
    .where(and(eq(confirmacoes.diaId, diaId), isNotNull(confirmacoes.entrada), isNull(confirmacoes.saida)));
}
