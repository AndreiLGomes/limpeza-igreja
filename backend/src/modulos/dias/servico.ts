/** Regras das sextas para a parte pública. */
import { ehPassada, ESCALA_MAX_DIAS, type CodigoDeErro, type DiaPublico } from '@limpeza/shared';
import { ErroApp } from '../../comum/erros.js';
import { paraDiaPublico } from '../../comum/mapeadores.js';
import { hoje } from '../../comum/tempo.js';
import * as repositorio from './repositorio.js';

/**
 * Garante que a sexta (ou o que pertence a ela) existe e não passou (C3, X4, T2, S10).
 * Sem a sexta: 404 com o código informado. Sexta passada: 409 SEXTA_PASSADA.
 */
export function exigirNaoPassada<T extends { data: string }>(
  item: T | undefined,
  naoEncontrado: CodigoDeErro = 'DIA_NAO_ENCONTRADO',
): asserts item is T {
  if (!item) throw new ErroApp(naoEncontrado);
  if (ehPassada(item.data, hoje())) throw new ErroApp('SEXTA_PASSADA');
}

/** S12: as sextas de hoje em diante, em ordem de data, no máximo 8. */
export async function escalaPublica(): Promise<DiaPublico[]> {
  const proximas = await repositorio.listarAPartirDe(hoje(), ESCALA_MAX_DIAS);
  return proximas.map(paraDiaPublico);
}

export async function diaPublico(id: string): Promise<DiaPublico> {
  const dia = await repositorio.buscarCompleto(id);
  if (!dia) throw new ErroApp('DIA_NAO_ENCONTRADO');
  return paraDiaPublico(dia);
}
