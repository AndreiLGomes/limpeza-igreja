/**
 * Configuração do drizzle-kit, usada só para GERAR migrações a partir do esquema
 * (npm run migracao:gerar). Não conecta no banco; quem aplica as migrações é codigo/banco/migrar.ts.
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './codigo/banco/esquema.ts',
  out: './codigo/banco/migracoes',
});
