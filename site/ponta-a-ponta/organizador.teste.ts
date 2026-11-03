/**
 * Cenários de ponta a ponta da área de quem organiza (docs/07, cenários 9–13 e 15).
 * Dados de exemplo (servidor/codigo/banco/exemplos.ts): 4 limpezas, às quintas, a partir da próxima
 * quinta-feira; na primeira, Andrei (47 90000-0001), João e Maria; na segunda, Paulo; cada uma com 4 tarefas.
 */
import type { Page } from '@playwright/test';
import { dataPorExtenso, hoje, proximoDiaDaSemana, somarDias } from '@limpeza/compartilhado';
import { primeiraLimpezaDeExemplo, TAREFAS_DE_EXEMPLO } from '../../servidor/codigo/banco/exemplos';
import { SENHA_DOS_TESTES } from './ajuda/ambiente';
import { expect, notificacao, semRolagemLateral, teste } from './ajuda/teste';

/** A primeira limpeza dos dados de exemplo (o banco volta a eles antes de cada teste). */
const primeiraLimpeza = () => primeiraLimpezaDeExemplo(hoje());

const cartaoDaLimpeza = (pagina: Page, data: string) =>
  pagina.locator('app-cartao').filter({ has: pagina.getByRole('heading', { name: dataPorExtenso(data) }) });

async function entrar(pagina: Page): Promise<void> {
  await pagina.goto('/organizar/entrar');
  await pagina.getByLabel('Senha de organizador').fill(SENHA_DOS_TESTES);
  await pagina.getByRole('button', { name: 'Entrar' }).click();
  await expect(pagina).toHaveURL(/\/organizar$/);
}

teste('9. senha errada mostra a mensagem no campo; a certa abre a área com "Organizador" e telefones @escuro', async ({
  page,
}) => {
  await page.goto('/organizar');
  await expect(page).toHaveURL(/\/organizar\/entrar$/);
  await page.getByLabel('Senha de organizador').fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Senha incorreta. Peça a senha para quem administra o app.')).toBeVisible();
  await semRolagemLateral(page);

  await page.getByLabel('Senha de organizador').fill(SENHA_DOS_TESTES);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/organizar$/);
  await expect(page.locator('.appbar__tag')).toHaveText('Organizador');
  await expect(page.getByRole('link', { name: '47 90000-0001' })).toBeVisible();
  await expect(page.getByRole('link', { name: '47 90000-0001' })).toHaveAttribute('href', 'tel:+5547900000001');
  await expect(page.getByText('"vou levar o rodo novo"')).toBeVisible();
  await expect(page).toHaveTitle('Limpezas · Limpeza da Igreja');
  await semRolagemLateral(page);
});

teste('10. remover pessoa: janela com foco em "Manter", notificação e "Desfazer" devolve a pessoa', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: 'Remover Andrei Gomes' }).click();
  const janela = page.getByRole('dialog', { name: 'Remover Andrei Gomes?' });
  await expect(janela).toBeVisible();
  await expect(janela.getByRole('button', { name: 'Manter' })).toBeFocused();

  await janela.getByRole('button', { name: 'Remover' }).click();
  await expect(notificacao(page, 'Andrei Gomes foi removido(a) da escala.')).toBeVisible();
  await expect(page.locator('.list__title').filter({ hasText: 'Andrei Gomes' })).toHaveCount(0);

  await notificacao(page, 'Andrei Gomes foi removido(a) da escala.').getByRole('button', { name: 'Desfazer' }).click();
  await expect(page.locator('.list__title').filter({ hasText: 'Andrei Gomes' })).toBeVisible();
  await expect(page.getByRole('link', { name: '47 90000-0001' })).toBeVisible();
  await semRolagemLateral(page);
});

teste('11. nova limpeza: tarefas sugeridas, qualquer dia, contador, foco na tarefa nova e salvar', async ({
  page,
}) => {
  await entrar(page);
  await page.getByRole('link', { name: 'Nova limpeza' }).click();
  await expect(page).toHaveURL(/\/organizar\/limpeza\/nova$/);
  await expect(page.getByRole('heading', { name: 'Nova limpeza' })).toBeVisible();

  // S7: já vem com as tarefas da limpeza mais recente.
  const tarefas = page.locator('.editlist__row input');
  await expect(tarefas).toHaveCount(4);
  expect(await tarefas.evaluateAll((campos) => campos.map((campo) => (campo as HTMLInputElement).value))).toEqual(
    TAREFAS_DE_EXEMPLO,
  );

  // S6: qualquer dia da semana vale (aqui, uma segunda), sem aviso de dia.
  const novaData = proximoDiaDaSemana(somarDias(primeiraLimpeza(), 7 * 6), 'Segunda');
  await page.getByLabel('Data').fill(novaData);
  await expect(page.locator('app-aviso')).toHaveCount(0);

  // Contador + e −.
  const vagas = page.getByRole('spinbutton', { name: 'Vagas' });
  await expect(vagas).toHaveValue('5');
  await page.getByRole('button', { name: 'Aumentar vagas' }).click();
  await expect(vagas).toHaveValue('6');
  await page.getByRole('button', { name: 'Diminuir vagas' }).click();
  await expect(vagas).toHaveValue('5');

  // "Adicionar tarefa" põe o cursor na linha nova.
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();
  await expect(page.getByLabel('Tarefa 5', { exact: true })).toBeFocused();
  await page.keyboard.type('Lavar a calçada');

  await semRolagemLateral(page);
  await page.getByRole('button', { name: 'Salvar limpeza' }).click();
  await expect(page).toHaveURL(/\/organizar$/);
  await expect(notificacao(page, /Limpeza criada para segunda, \d+ de \w+\./)).toBeVisible();
  await expect(cartaoDaLimpeza(page, novaData)).toContainText('0 de 5 vagas · 5 tarefas');
});

teste('12. editar: vagas abaixo dos confirmados mostram o aviso e bloqueiam "Salvar"', async ({ page }) => {
  await entrar(page);
  const primeira = primeiraLimpeza();
  await cartaoDaLimpeza(page, primeira).getByRole('link', { name: /^Editar / }).click();
  await expect(page.getByRole('heading', { name: 'Editar limpeza' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Vagas' })).toHaveValue('5');

  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Diminuir vagas' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Vagas' })).toHaveValue('2');
  await expect(page.getByText('Já 3 pessoas confirmaram. As vagas não podem ser menos que isso.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar limpeza' })).toBeDisabled();

  await page.getByRole('button', { name: 'Aumentar vagas' }).click();
  await expect(page.getByRole('button', { name: 'Salvar limpeza' })).toBeEnabled();
  await semRolagemLateral(page);
});

teste('13. apagar limpeza: janela e a limpeza some da lista', async ({ page }) => {
  await entrar(page);
  const quartaLimpeza = somarDias(primeiraLimpeza(), 21);
  await expect(page.locator('app-cartao')).toHaveCount(4);
  await cartaoDaLimpeza(page, quartaLimpeza).getByRole('link', { name: /^Editar / }).click();
  await page.getByRole('button', { name: 'Apagar limpeza' }).click();

  const janela = page.getByRole('dialog', { name: 'Apagar esta limpeza?' });
  await expect(janela).toContainText('Ninguém confirmou presença nela.');
  await expect(janela.getByRole('button', { name: 'Manter limpeza' })).toBeFocused();
  await janela.getByRole('button', { name: 'Apagar limpeza' }).click();

  await expect(page).toHaveURL(/\/organizar$/);
  await expect(notificacao(page, 'Limpeza apagada.')).toBeVisible();
  await expect(page.locator('app-cartao')).toHaveCount(3);
  await expect(cartaoDaLimpeza(page, quartaLimpeza)).toHaveCount(0);
});

teste('15. "Sair" no rodapé: abrir /organizar pede a senha de novo', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/localhost:4200\/$/);
  await expect(page.getByRole('link', { name: 'Área de quem organiza' })).toBeVisible();

  await page.goto('/organizar');
  await expect(page).toHaveURL(/\/organizar\/entrar$/);
  await expect(page.getByLabel('Senha de organizador')).toBeVisible();
});
