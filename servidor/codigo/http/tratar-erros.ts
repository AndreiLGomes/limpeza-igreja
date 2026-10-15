/**
 * O ÚNICO lugar que transforma erro em resposta JSON (docs/04-api.md).
 * O Express 5 traz até aqui os erros de rotas async, então as rotas não precisam de try/catch.
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ErroDeRegra } from '../comum/erros.js';

/** Erros que o próprio Express gera ao ler o corpo (JSON quebrado, corpo grande demais). */
function ehErroDeCorpo(erro: unknown): boolean {
  const tipo = (erro as { type?: unknown } | null)?.type;
  return tipo === 'entity.parse.failed' || tipo === 'entity.too.large';
}

/**
 * Resumo do erro para o registro, sem a mensagem: mensagens do banco podem trazer valores
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
  throw new ErroDeRegra('ROTA_NAO_ENCONTRADA');
};

export const tratarErros: ErrorRequestHandler = (erro, requisicao, resposta, proximo) => {
  if (resposta.headersSent) return proximo(erro);

  let erroApp: ErroDeRegra;
  if (erro instanceof ErroDeRegra) {
    erroApp = erro;
  } else if (ehErroDeCorpo(erro)) {
    erroApp = new ErroDeRegra('DADOS_INVALIDOS');
  } else {
    requisicao.log?.error({ erro: resumoParaLog(erro) }, 'erro inesperado');
    erroApp = new ErroDeRegra('ERRO_INTERNO');
  }
  resposta.status(erroApp.status).json(erroApp.paraResposta());
};
