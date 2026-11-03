/**
 * Testes de ponta a ponta (docs/07): Playwright num Chromium de 375×800, em português, contra o
 * servidor e o site de verdade. O servidor usa o banco de TESTE. Rode com "npm run testes:ponta-a-ponta".
 * As portas 3000 e 4200 precisam estar livres (desligue o "npm start" e o "npm run desenvolver").
 */
import { defineConfig, devices } from '@playwright/test';
import { FUSO_DO_APP } from '@limpeza/compartilhado';
import { AMBIENTE_DO_SERVIDOR, ENDERECO_DA_API, ENDERECO_DO_SITE, PASTA_RAIZ } from './ponta-a-ponta/ajuda/ambiente';

export default defineConfig({
  testDir: 'ponta-a-ponta',
  testMatch: '**/*.teste.ts',
  globalSetup: './ponta-a-ponta/ajuda/preparar.ts',
  // Os testes dividem o mesmo banco: um de cada vez.
  fullyParallel: false,
  workers: 1,
  outputDir: 'ponta-a-ponta/resultados',
  reporter: [['list']],
  use: {
    baseURL: ENDERECO_DO_SITE,
    locale: 'pt-BR',
    timezoneId: FUSO_DO_APP,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'tema claro',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 800 }, colorScheme: 'light' },
    },
    {
      // Repete no tema escuro os cenários marcados com @escuro (1, 4, 9 e 14; docs/08, Etapa 8).
      name: 'tema escuro',
      grep: /@escuro/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 800 }, colorScheme: 'dark' },
    },
  ],
  webServer: [
    {
      command: 'npm run desenvolver -w servidor',
      cwd: PASTA_RAIZ,
      url: `${ENDERECO_DA_API}/saude`,
      env: AMBIENTE_DO_SERVIDOR,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm start',
      url: ENDERECO_DO_SITE,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
