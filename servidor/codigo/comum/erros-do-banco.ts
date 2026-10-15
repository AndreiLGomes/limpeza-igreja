/** Reconhece erros do PostgreSQL, mesmo quando o Drizzle os embrulha num erro próprio. */
import type { CodigoDeErro } from '@limpeza/compartilhado';
import { ErroDeRegra } from './erros.js';

const VIOLA_UNIQUE = '23505';

interface ErroDoPostgres {
  code?: string;
  constraint?: string;
}

function erroDoPostgres(erro: unknown): ErroDoPostgres | undefined {
  if (typeof erro !== 'object' || erro === null) return undefined;
  if ('code' in erro) return erro as ErroDoPostgres;
  return 'cause' in erro ? erroDoPostgres(erro.cause) : undefined;
}

/** true se o erro foi a restrição UNIQUE com esse nome (ex.: "confirmacoes_telefone_unico_no_dia"). */
export function violouUnico(erro: unknown, restricao: string): boolean {
  const pg = erroDoPostgres(erro);
  return pg?.code === VIOLA_UNIQUE && pg.constraint === restricao;
}

/**
 * Roda a ação e, se o banco recusar pela restrição UNIQUE indicada, troca o erro pelo da regra.
 * É a garantia do banco quando dois pedidos iguais chegam ao mesmo tempo.
 */
export async function comRestricaoUnica<T>(
  restricao: string,
  codigo: CodigoDeErro,
  acao: () => Promise<T>,
): Promise<T> {
  try {
    return await acao();
  } catch (erro) {
    if (violouUnico(erro, restricao)) throw new ErroDeRegra(codigo);
    throw erro;
  }
}
