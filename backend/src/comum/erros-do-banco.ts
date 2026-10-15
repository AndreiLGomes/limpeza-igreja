/** Reconhece erros do PostgreSQL, mesmo quando o Drizzle os embrulha num erro próprio. */

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
