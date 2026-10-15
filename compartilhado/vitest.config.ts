import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Os testes ficam em testes/ e terminam em .teste.ts.
    include: ['testes/**/*.teste.ts'],
  },
});
