/**
 * `teste` = o `test` do Playwright com as conferências que o docs/07 pede em TODA tela visitada:
 * - nenhum erro no console;
 * - nenhuma rolagem lateral (largura da página ≤ 375).
 * Antes de cada teste, o banco de teste volta aos dados de exemplo.
 */
import { expect, test as base, type Locator, type Page } from '@playwright/test';
import { reiniciarDados } from './ambiente';

/**
 * Mensagens do navegador sobre respostas HTTP de erro (ex.: 409 "telefone repetido", ou a API
 * desligada de propósito) não são erros do app: são respostas esperadas que a tela trata.
 */
const ERRO_DE_REDE_ESPERADO = /Failed to load resource|net::ERR_/;

export const teste = base.extend<{ errosNoConsole: string[] }>({
  errosNoConsole: [
    async ({ page }, usar) => {
      const erros: string[] = [];
      page.on('console', (mensagem) => {
        if (mensagem.type() === 'error' && !ERRO_DE_REDE_ESPERADO.test(mensagem.text())) erros.push(mensagem.text());
      });
      page.on('pageerror', (erro) => erros.push(erro.message));
      await usar(erros);
      expect(erros, 'erros no console').toEqual([]);
    },
    { auto: true },
  ],
});

teste.beforeEach(() => reiniciarDados());

/** Nenhuma rolagem lateral na tela atual. */
export async function semRolagemLateral(pagina: Page): Promise<void> {
  const largura = await pagina.evaluate(() => document.documentElement.scrollWidth);
  expect(largura, 'largura da página (rolagem lateral)').toBeLessThanOrEqual(375);
}

/** A notificação com este texto (pode haver mais de uma na tela ao mesmo tempo, até 3). */
export function notificacao(pagina: Page, texto: string | RegExp): Locator {
  return pagina.locator('.toast').filter({ hasText: texto });
}

export { expect };
