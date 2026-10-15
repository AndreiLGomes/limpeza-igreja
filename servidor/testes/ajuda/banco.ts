import { afterAll } from 'vitest';
import { apagarTudo } from '../../codigo/banco/apagar-tudo.js';
import { bd, fecharBanco } from '../../codigo/banco/cliente.js';

/** Apaga todos os dados do banco de teste. Use no beforeEach dos testes que gravam. */
export function limparBanco(): Promise<void> {
  return apagarTudo(bd);
}

// Cada arquivo de teste fecha as conexões ao terminar.
afterAll(fecharBanco);
