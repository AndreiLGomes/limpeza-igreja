/**
 * O ÚNICO lugar que transforma erro em resposta JSON (docs/04-api.md).
 * O Express 5 traz até aqui os erros de rotas async, então as rotas não precisam de try/catch.
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ErroApp } from '../comum/erros.js';

/** Erros que o próprio Express gera ao ler o corpo (JSON quebrado, corpo grande demais). */
function ehErroDeCorpo(erro: unknown): boolean {
  const tipo = (erro as { type?: unknown } | null)?.type;
  return tipo === 'entity.parse.failed' || tipo === 'entity.too.large';
}

/**
 * Resumo do erro para o log, sem a mensagem: mensagens do banco podem trazer valores
 * digitados pelas pessoas (P4). Fica o tipo, o código e onde aconteceu.
 */
function resumoParaLog(erro: unknown) {
  if (!(erro instanceof Error)) return { tipo: typeof erro };
  return {
    tipo: erro.name,
    codigo: (erro as { code?: unknown }).code,
    onde: erro.stack?.split('\n').slice(1, 6).map((linha) => linha.trim()),
  };
}

/** Endereço que não existe: responde no mesmo formato de erro, em vez da página HTML do Express. */
export const rotaNaoEncontrada: RequestHandler = () => {
  throw new ErroApp('ROTA_NAO_ENCONTRADA');
};

export const tratarErros: ErrorRequestHandler = (erro, req, res, next) => {
  if (res.headersSent) return next(erro);

  let erroApp: ErroApp;
  if (erro instanceof ErroApp) {
    erroApp = erro;
  } else if (ehErroDeCorpo(erro)) {
    erroApp = new ErroApp('DADOS_INVALIDOS');
  } else {
    req.log?.error({ erro: resumoParaLog(erro) }, 'erro inesperado');
    erroApp = new ErroApp('ERRO_INTERNO');
  }
  res.status(erroApp.status).json(erroApp.paraResposta());
};
