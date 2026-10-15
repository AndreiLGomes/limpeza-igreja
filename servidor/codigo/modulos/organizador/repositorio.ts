/** Leitura e gravação das sessões de organizador. Sem regra de negócio. */
import { and, eq, gt, lte, sql } from 'drizzle-orm';
import { bd } from '../../banco/cliente.js';
import { sessoesOrganizador } from '../../banco/esquema.js';

/** Cria a sessão; a validade é calculada pelo relógio do banco. Devolve quando ela expira. */
export async function criarSessao(tokenHash: string, horas: number): Promise<Date> {
  const [sessao] = await bd
    .insert(sessoesOrganizador)
    .values({ tokenHash, expiraEm: sql`now() + make_interval(hours => ${horas})` })
    .returning({ expiraEm: sessoesOrganizador.expiraEm });
  if (!sessao) throw new Error('A sessão não foi criada.');
  return sessao.expiraEm;
}

/** Id da sessão com esse token, se ela ainda não expirou. */
export async function buscarSessaoValida(tokenHash: string): Promise<string | undefined> {
  const [sessao] = await bd
    .select({ id: sessoesOrganizador.id })
    .from(sessoesOrganizador)
    .where(and(eq(sessoesOrganizador.tokenHash, tokenHash), gt(sessoesOrganizador.expiraEm, sql`now()`)));
  return sessao?.id;
}

export async function apagarSessao(id: string): Promise<void> {
  await bd.delete(sessoesOrganizador).where(eq(sessoesOrganizador.id, id));
}

export async function apagarSessoesExpiradas(): Promise<void> {
  await bd.delete(sessoesOrganizador).where(lte(sessoesOrganizador.expiraEm, sql`now()`));
}
