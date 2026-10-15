/**
 * emTransacao(fn): roda tudo dentro de uma transação. Usado onde a regra precisa travar
 * uma linha do banco, como a última vaga (C5).
 */
import { bd, type Banco } from './cliente.js';

export type Transacao = Parameters<Parameters<Banco['transaction']>[0]>[0];

/** Quem executa consultas: o banco direto ou uma transação aberta. */
export type Executor = Banco | Transacao;

export function emTransacao<T>(fn: (tx: Transacao) => Promise<T>): Promise<T> {
  return bd.transaction(fn);
}
