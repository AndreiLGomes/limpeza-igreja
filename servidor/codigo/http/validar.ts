/**
 * validar({ corpo?, parametros? }): valida a entrada com os esquemas do compartilhado, antes da rota.
 * - Corpo inválido: 400 DADOS_INVALIDOS com `campos` (a mensagem de cada campo vem do esquema).
 * - Id do endereço inválido: 404 com o código informado (ex.: DIA_NAO_ENCONTRADO), porque para
 *   quem chama é só um endereço que não existe.
 * Depois de validar, requisicao.body passa a ter os dados já tratados (nome aparado, telefone só com números…).
 */
import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { errosPorCampo, esquemaParametrosDia, type CodigoDeErro } from '@limpeza/compartilhado';
import { ErroDeRegra } from '../comum/erros.js';

interface Esquemas {
  corpo?: z.ZodType;
  parametros?: z.ZodType;
  /** Código do 404 quando um id do endereço não é válido. */
  naoEncontrado?: CodigoDeErro;
}

/** Parâmetro `:id` de uma limpeza; id que não é UUID responde 404 DIA_NAO_ENCONTRADO. */
export const DIA_VALIDO = { parametros: esquemaParametrosDia, naoEncontrado: 'DIA_NAO_ENCONTRADO' } as const;

export function validar({ corpo, parametros, naoEncontrado = 'ROTA_NAO_ENCONTRADA' }: Esquemas): RequestHandler {
  return (requisicao, _resposta, proximo) => {
    if (parametros && !parametros.safeParse(requisicao.params).success) {
      throw new ErroDeRegra(naoEncontrado);
    }
    if (corpo) {
      const resultado = corpo.safeParse(requisicao.body ?? {});
      if (!resultado.success) {
        throw new ErroDeRegra('DADOS_INVALIDOS', { campos: errosPorCampo(resultado.error) });
      }
      requisicao.body = resultado.data;
    }
    proximo();
  };
}
