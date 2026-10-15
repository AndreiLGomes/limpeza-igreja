/**
 * validar({ body?, params? }): valida a entrada com os esquemas do shared, antes da rota.
 * - Corpo inválido: 400 DADOS_INVALIDOS com `campos` (a mensagem de cada campo vem do esquema).
 * - Id do endereço inválido: 404 com o código informado (ex.: DIA_NAO_ENCONTRADO), porque para
 *   quem chama é só um endereço que não existe.
 * Depois de validar, req.body passa a ter os dados já tratados (nome aparado, telefone só com números…).
 */
import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { errosPorCampo, type CodigoDeErro } from '@limpeza/shared';
import { ErroApp } from '../comum/erros.js';

interface Esquemas {
  body?: z.ZodType;
  params?: z.ZodType;
  /** Código do 404 quando um id do endereço não é válido. */
  naoEncontrado?: CodigoDeErro;
}

export function validar({ body, params, naoEncontrado = 'ROTA_NAO_ENCONTRADA' }: Esquemas): RequestHandler {
  return (req, _res, next) => {
    if (params && !params.safeParse(req.params).success) {
      throw new ErroApp(naoEncontrado);
    }
    if (body) {
      const resultado = body.safeParse(req.body ?? {});
      if (!resultado.success) {
        throw new ErroApp('DADOS_INVALIDOS', { campos: errosPorCampo(resultado.error) });
      }
      req.body = resultado.data;
    }
    next();
  };
}
