import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Recria o banco de teste e aplica as migrações, uma vez antes de tudo.
    globalSetup: ['test/ajuda/preparar-banco.ts'],
    // Carrega o .env (ou o .env.exemplo) antes de qualquer teste importar config.ts.
    setupFiles: ['test/ajuda/ambiente.ts'],
    // Os arquivos de teste dividem o mesmo banco: rodam um de cada vez para um não apagar o dado do outro.
    fileParallelism: false,
  },
});
