import { criarAplicacao, type OpcoesDaAplicacao } from '../../codigo/aplicacao.js';
import { criarRegistro } from '../../codigo/http/registro.js';

/**
 * O mesmo criarAplicacao() do servidor, com log silencioso e o limite geral de escritas bem alto,
 * para os testes que fazem muitas requisições não esbarrarem nele. O teste do limite passa o valor real.
 */
export function criarAplicacaoDeTeste(opcoes: OpcoesDaAplicacao = {}) {
  return criarAplicacao({ registro: criarRegistro('silent'), escritasPorMinuto: 10_000, ...opcoes });
}
