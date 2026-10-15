import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Os testes ficam em testes/ e terminam em .teste.ts.
    include: ['testes/**/*.teste.ts'],
    // Recria o banco de teste e aplica as migrações, uma vez antes de tudo.
    globalSetup: ['testes/ajuda/preparar-banco.ts'],
    // Carrega o .env (ou o .env.exemplo) antes de qualquer teste importar configuracao.ts.
    setupFiles: ['testes/ajuda/ambiente.ts'],
    // Os arquivos de teste dividem o mesmo banco: rodam um de cada vez para um não apagar o dado do outro.
    fileParallelism: false,
  },
});
