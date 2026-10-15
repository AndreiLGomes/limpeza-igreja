/**
 * Prepara as variáveis de ambiente dos testes: usa o .env de quem programa ou, se não houver,
 * o .env.exemplo (que aponta para o banco local do docker-compose.yml).
 * Variáveis já definidas no terminal não são sobrescritas, menos as duas abaixo.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

/** Senha de organizador usada SÓ nos testes. A senha real (do .env) nunca é usada aqui. */
export const SENHA_DE_TESTE = 'senha-so-dos-testes';

const pastaDoBackend = fileURLToPath(new URL('../../', import.meta.url));
const arquivo = ['.env', '.env.exemplo'].map((nome) => pastaDoBackend + nome).find(existsSync);

if (arquivo) process.loadEnvFile(arquivo);
process.env['NODE_ENV'] = 'test';
// Custo baixo (4) só para os testes ficarem rápidos; em produção o custo é 12.
process.env['SENHA_ORGANIZADOR_HASH'] = bcrypt.hashSync(SENHA_DE_TESTE, 4);
