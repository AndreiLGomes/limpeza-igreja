/** L11: o cabeçalho padrão da folha (uma linha só, id 1). Sem regra de negócio. */
import { eq } from 'drizzle-orm';
import { CABECALHO_VAZIO, type Cabecalho } from '@limpeza/compartilhado';
import { bd } from '../../banco/cliente.js';
import { cabecalhoPadrao } from '../../banco/esquema.js';
import type { Executor } from '../../banco/transacao.js';
import { paraCabecalho } from '../../comum/mapeadores.js';

const LINHA_UNICA = 1;

export async function lerPadrao(): Promise<Cabecalho> {
  const [linha] = await bd.select().from(cabecalhoPadrao).where(eq(cabecalhoPadrao.id, LINHA_UNICA));
  return linha ? paraCabecalho(linha) : CABECALHO_VAZIO;
}

export async function salvarPadrao(tx: Executor, cabecalho: Cabecalho): Promise<void> {
  await tx
    .insert(cabecalhoPadrao)
    .values({ id: LINHA_UNICA, ...cabecalho })
    .onConflictDoUpdate({ target: cabecalhoPadrao.id, set: cabecalho });
}
