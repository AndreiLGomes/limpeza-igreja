/** Roda uma vez antes de todos os testes de ponta a ponta: tabelas e dados de exemplo no banco de teste. */
import { aplicarMigracoes, reiniciarDados } from './ambiente';

export default function preparar(): void {
  aplicarMigracoes();
  reiniciarDados();
}
