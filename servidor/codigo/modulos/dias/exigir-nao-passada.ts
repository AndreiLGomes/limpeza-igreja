import { ehPassada, hoje, type CodigoDeErro } from '@limpeza/compartilhado';
import { ErroDeRegra } from '../../comum/erros.js';

/**
 * Garante que a limpeza (ou o que pertence a ela) existe e não passou (C3, X4, T2, S10).
 * Sem a limpeza: 404 com o código informado. Limpeza passada: 409 LIMPEZA_PASSADA.
 */
export function exigirNaoPassada<T extends { data: string }>(
  item: T | undefined,
  naoEncontrado: CodigoDeErro = 'DIA_NAO_ENCONTRADO',
): asserts item is T {
  if (!item) throw new ErroDeRegra(naoEncontrado);
  if (ehPassada(item.data, hoje())) throw new ErroDeRegra('LIMPEZA_PASSADA');
}
