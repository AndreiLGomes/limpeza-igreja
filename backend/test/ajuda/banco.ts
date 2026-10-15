import { afterAll } from 'vitest';
import { apagarTudo } from '../../src/banco/apagar-tudo.js';
import { db, fecharBanco } from '../../src/banco/cliente.js';

/** Apaga todos os dados do banco de teste. Use no beforeEach dos testes que gravam. */
export function limparBanco(): Promise<void> {
  return apagarTudo(db);
}

// Cada arquivo de teste fecha as conexões ao terminar.
afterAll(fecharBanco);
