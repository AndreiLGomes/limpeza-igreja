import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Carrega o .env (ou o .env.exemplo) antes de qualquer teste importar config.ts.
    setupFiles: ['test/ajuda/ambiente.ts'],
  },
});
