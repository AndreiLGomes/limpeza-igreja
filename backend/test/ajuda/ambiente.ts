/**
 * Prepara as variáveis de ambiente dos testes: usa o .env de quem programa ou, se não houver,
 * o .env.exemplo (que aponta para o banco local do docker-compose.yml).
 * Variáveis já definidas no terminal não são sobrescritas.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pastaDoBackend = fileURLToPath(new URL('../../', import.meta.url));
const arquivo = ['.env', '.env.exemplo'].map((nome) => pastaDoBackend + nome).find(existsSync);

if (arquivo) process.loadEnvFile(arquivo);
process.env['NODE_ENV'] = 'test';
