/**
 * Log do servidor sem dados pessoais (P4): só método, endereço sem a parte "?…", status e tempo.
 * Nunca nome, telefone, senha, token, código de cancelamento ou corpo da requisição.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { pino, type DestinationStream, type Level, type Logger } from 'pino';
import { pinoHttp } from 'pino-http';

export type Log = Logger;

export function criarLog(nivel: Level | 'silent' = 'info', destino?: DestinationStream): Log {
  return pino({ level: nivel }, destino);
}

/** Endereço sem a parte de busca (?…), que poderia carregar dados. */
function enderecoSemBusca(url: string | undefined): string {
  return (url ?? '').split('?')[0] ?? '';
}

export function registrarRequisicoes(log: Log) {
  return pinoHttp({
    logger: log,
    // Não inventa um id por requisição nem copia cabeçalhos (Authorization tem o token).
    genReqId: () => '',
    serializers: {
      req: (req: IncomingMessage) => ({ metodo: req.method, endereco: enderecoSemBusca(req.url) }),
      res: (res: ServerResponse) => ({ status: res.statusCode }),
      // O erro em si é registrado por tratar-erros.ts, já sem dados pessoais.
      err: () => undefined,
    },
    customSuccessMessage: () => 'requisição atendida',
    customErrorMessage: () => 'requisição com erro',
  });
}
