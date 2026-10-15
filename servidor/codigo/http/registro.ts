/**
 * Registro do servidor sem dados pessoais (P4): só método, endereço sem a parte "?…", status e tempo.
 * Nunca nome, telefone, senha, token, código de cancelamento ou corpo da requisição.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { pino, type DestinationStream, type Level, type Logger } from 'pino';
import { pinoHttp } from 'pino-http';

export type Registro = Logger;

export function criarRegistro(nivel: Level | 'silent' = 'info', destino?: DestinationStream): Registro {
  return pino({ level: nivel }, destino);
}

/** Endereço sem a parte de busca (?…), que poderia carregar dados. */
function enderecoSemBusca(url: string | undefined): string {
  return (url ?? '').split('?')[0] ?? '';
}

export function registrarRequisicoes(registro: Registro) {
  return pinoHttp({
    logger: registro,
    // Não inventa um id por requisição nem copia cabeçalhos (Authorization tem o token).
    genReqId: () => '',
    serializers: {
      // As chaves "req" e "res" são exigidas pelo pino-http.
      req: (requisicao: IncomingMessage) => ({ metodo: requisicao.method, endereco: enderecoSemBusca(requisicao.url) }),
      res: (resposta: ServerResponse) => ({ status: resposta.statusCode }),
      // O erro em si é registrado por tratar-erros.ts, já sem dados pessoais.
      err: () => undefined,
    },
    customSuccessMessage: () => 'requisição atendida',
    customErrorMessage: () => 'requisição com erro',
  });
}
