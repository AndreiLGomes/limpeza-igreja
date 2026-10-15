/**
 * Ambiente dos testes de ponta a ponta: o servidor roda com o banco de TESTE (nunca o de
 * desenvolvimento) e com uma senha de organizador só dos testes.
 */
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';

/**
 * Pasta raiz do projeto (onde fica o package.json com os workspaces). Os testes sempre rodam a
 * partir de site/ ("npm run testes:ponta-a-ponta"), então a raiz é a pasta de cima.
 */
export const PASTA_RAIZ = resolve(process.cwd(), '..');

export const ENDERECO_DO_SITE = 'http://localhost:4200';
export const ENDERECO_DA_API = 'http://localhost:3000/api';

/** Senha de organizador usada SÓ nestes testes. */
export const SENHA_DOS_TESTES = 'senha-dos-testes-ponta-a-ponta';

const BANCO_DE_TESTE = 'postgres://limpeza:limpeza@localhost:5432/limpeza_teste';

/** Variáveis de ambiente do servidor nos testes (têm prioridade sobre o servidor/.env). */
export const AMBIENTE_DO_SERVIDOR: Record<string, string> = {
  NODE_ENV: 'development',
  PORTA: '3000',
  URL_DO_BANCO: BANCO_DE_TESTE,
  URL_DO_BANCO_TESTE: BANCO_DE_TESTE,
  ORIGEM_DO_SITE: ENDERECO_DO_SITE,
  // Custo baixo (4) só para os testes; em produção o custo é 12.
  SENHA_ORGANIZADOR_HASH: bcrypt.hashSync(SENHA_DOS_TESTES, 4),
};

/** Roda um comando do servidor (migrar, dados-de-exemplo) contra o banco de teste. */
function comandoDoServidor(comando: string): void {
  execSync(`npm run ${comando} -w servidor --silent`, {
    cwd: PASTA_RAIZ,
    env: { ...process.env, ...AMBIENTE_DO_SERVIDOR },
    stdio: 'pipe',
  });
}

export function aplicarMigracoes(): void {
  comandoDoServidor('migrar');
}

/** Volta o banco de teste aos dados de exemplo (4 sextas; Andrei, João e Maria na primeira). */
export function reiniciarDados(): void {
  comandoDoServidor('dados-de-exemplo');
}
