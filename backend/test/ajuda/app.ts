import { criarApp, type OpcoesDoApp } from '../../src/app.js';
import { criarLog } from '../../src/http/log.js';

/** O mesmo criarApp() do servidor, com log silencioso por padrão. */
export function criarAppDeTeste(opcoes: OpcoesDoApp = {}) {
  return criarApp({ log: criarLog('silent'), ...opcoes });
}
