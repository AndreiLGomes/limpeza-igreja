import { criarApp, type OpcoesDoApp } from '../../src/app.js';
import { criarLog } from '../../src/http/log.js';

/**
 * O mesmo criarApp() do servidor, com log silencioso e o limite geral de escritas bem alto,
 * para os testes que fazem muitas requisições não esbarrarem nele. O teste do limite passa o valor real.
 */
export function criarAppDeTeste(opcoes: OpcoesDoApp = {}) {
  return criarApp({ log: criarLog('silent'), escritasPorMinuto: 10_000, ...opcoes });
}
