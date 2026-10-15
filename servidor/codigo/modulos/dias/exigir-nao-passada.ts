import { ehPassada, type CodigoDeErro } from '@limpeza/compartilhado';
import { ErroDeRegra } from '../../comum/erros.js';
import { hoje } from '../../comum/tempo.js';

/**
 * Garante que a sexta (ou o que pertence a ela) existe e não passou (C3, X4, T2, S10).
 * Sem a sexta: 404 com o código informado. Sexta passada: 409 SEXTA_PASSADA.
 */
export function exigirNaoPassada<T extends { data: string }>(
  item: T | undefined,
  naoEncontrado: CodigoDeErro = 'DIA_NAO_ENCONTRADO',
): asserts item is T {
  if (!item) throw new ErroDeRegra(naoEncontrado);
  if (ehPassada(item.data, hoje())) throw new ErroDeRegra('SEXTA_PASSADA');
}
