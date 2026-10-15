/**
 * Cenários de ponta a ponta da parte pública (docs/07, cenários 1–8, 14, 16 e 17).
 * Dados de exemplo: 4 sextas; na primeira, Andrei (47900000001), João (47900000002) e Maria;
 * cada sexta com 4 tarefas. O banco volta a esse estado antes de cada teste.
 */
import type { Page } from '@playwright/test';
import { expect, notificacao, semRolagemLateral, teste } from './ajuda/teste';

/** O cartão da próxima sexta na tela inicial. */
const cartao = (pagina: Page) => pagina.locator('app-cartao-do-dia').first();

/** Confirma presença pelo formulário (sem esperar o fim). */
async function preencherConfirmacao(pagina: Page, nome: string, telefone: string): Promise<void> {
  await pagina.goto('/confirmar');
  await pagina.getByLabel('Seu nome').fill(nome);
  await pagina.getByLabel('Telefone').fill(telefone);
}

teste('1. a tela inicial mostra linhas cinzas e depois o cartão da próxima sexta @escuro', async ({ page }) => {
  // Atrasa a resposta da escala para dar tempo de ver o "carregando".
  await page.route('**/api/dias', async (rota) => {
    await new Promise((pronto) => setTimeout(pronto, 800));
    await rota.continue();
  });
  await page.goto('/');
  await expect(page.locator('.skeleton').first()).toBeVisible();
  await expect(cartao(page).locator('.card__title')).toHaveText(/^Sexta, \d+ de \w+/);
  await expect(page.locator('.skeleton')).toHaveCount(0);
  await expect(page).toHaveTitle('Esta semana · Escala de Limpeza');
  await semRolagemLateral(page);
});

teste('2. confirmar vazio mostra o aviso "Faltam 2 informações" e as mensagens nos campos', async ({ page }) => {
  await page.goto('/confirmar');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(page.locator('form app-aviso')).toContainText('Faltam 2 informações.');
  await expect(page.getByText('Digite seu nome.')).toBeVisible();
  await expect(page.getByText('Digite seu telefone com DDD.')).toBeVisible();
  await expect(page).toHaveURL(/\/confirmar$/);
  await semRolagemLateral(page);
});

teste('3. confirmar com telefone já usado mostra a mensagem do servidor no aviso', async ({ page }) => {
  await preencherConfirmacao(page, 'Outra Pessoa', '47 90000-0001');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(page.locator('form app-aviso')).toContainText('Esse telefone já está confirmado nesta sexta.');
  await semRolagemLateral(page);
});

teste('4, 5 e 6. confirmar, ver "Você vai nesta sexta" e cancelar a própria presença @escuro', async ({ page }) => {
  // 4. Confirmar certo → "Salvando…" → volta ao início com notificação → nome no cartão.
  await page.route('**/api/dias/*/confirmacoes', async (rota) => {
    await new Promise((pronto) => setTimeout(pronto, 600));
    await rota.continue();
  });
  await preencherConfirmacao(page, 'Pedro Lima', '(47) 91234-5678');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(page.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
  await expect(page).toHaveURL(/\/$/);
  await expect(notificacao(page, /Presença confirmada para sexta, \d+ de \w+\./)).toBeVisible();
  await expect(cartao(page).getByRole('img', { name: 'Pedro Lima' })).toBeVisible();
  await semRolagemLateral(page);

  // 5. O cartão mostra "Você vai nesta sexta" e "Cancelar minha presença".
  await expect(cartao(page).getByText('Você vai nesta sexta')).toBeVisible();
  await expect(cartao(page).getByRole('button', { name: 'Confirmar presença' })).toHaveCount(0);

  // 6. Cancelar minha presença → janela → notificação → o nome some.
  await cartao(page).getByRole('button', { name: 'Cancelar minha presença' }).click();
  const janela = page.getByRole('dialog', { name: 'Cancelar sua presença?' });
  await expect(janela).toBeVisible();
  await expect(janela.getByRole('button', { name: 'Manter presença' })).toBeFocused();
  await janela.getByRole('button', { name: 'Cancelar presença' }).click();
  await expect(notificacao(page, 'Presença cancelada.')).toBeVisible();
  await expect(cartao(page).getByRole('img', { name: 'Pedro Lima' })).toHaveCount(0);
  await expect(cartao(page).getByText('Você vai nesta sexta')).toHaveCount(0);
});

teste('7. "Cancelar uma presença": telefone errado mostra a mensagem; o certo cancela', async ({ page }) => {
  await page.goto('/');
  await expect(cartao(page).getByRole('img', { name: 'João Silva' })).toBeVisible();
  await cartao(page).getByRole('button', { name: 'Cancelar uma presença' }).click();
  const janela = page.getByRole('dialog', { name: 'Cancelar uma presença?' });
  await expect(janela).toBeVisible();

  await janela.getByLabel('Seu telefone').fill('47 98888-7777');
  await janela.getByRole('button', { name: 'Cancelar presença' }).click();
  await expect(janela.getByText('Esse telefone não confere com nenhuma confirmação desta sexta.')).toBeVisible();

  await janela.getByLabel('Seu telefone').fill('47 90000-0002');
  await janela.getByRole('button', { name: 'Cancelar presença' }).click();
  await expect(notificacao(page, 'Presença cancelada.')).toBeVisible();
  await expect(janela).toBeHidden();
  await expect(cartao(page).getByRole('img', { name: 'João Silva' })).toHaveCount(0);
  await semRolagemLateral(page);
});

teste('8. tarefas: marcar → "1 de 4 feitas" e notificação; "Desfazer" → "0 de 4 feitas"', async ({ page }) => {
  await page.goto('/tarefas');
  const cartaoDeTarefas = page.locator('app-cartao').first();
  await expect(cartaoDeTarefas.locator('.card__meta')).toHaveText('0 de 4 feitas');
  await expect(cartaoDeTarefas.locator('app-etiqueta')).toHaveText('A fazer');

  await page.getByLabel('Varrer o salão').check();
  await expect(cartaoDeTarefas.locator('.card__meta')).toHaveText('1 de 4 feitas');
  await expect(cartaoDeTarefas.locator('app-etiqueta')).toHaveText('Em andamento');
  await expect(notificacao(page, 'Tarefa marcada como feita.')).toBeVisible();

  await notificacao(page, 'Tarefa marcada como feita.').getByRole('button', { name: 'Desfazer' }).click();
  await expect(cartaoDeTarefas.locator('.card__meta')).toHaveText('0 de 4 feitas');
  await expect(page.getByLabel('Varrer o salão')).not.toBeChecked();

  // A marcação foi gravada no servidor: recarregar mostra o mesmo.
  await page.getByLabel('Limpar os banheiros').check();
  await expect(cartaoDeTarefas.locator('.card__meta')).toHaveText('1 de 4 feitas');
  await page.reload();
  await expect(page.getByLabel('Limpar os banheiros')).toBeChecked();
  await semRolagemLateral(page);
});

teste('14. rodapé: trocar o tema e continuar trocado depois de recarregar @escuro', async ({ page }) => {
  await page.goto('/');
  // Na primeira visita, o tema segue o aparelho (o projeto "tema escuro" começa escuro).
  const inicial = await page.locator('html').getAttribute('data-theme');
  const outro = inicial === 'dark' ? 'light' : 'dark';
  await page.getByRole('button', { name: outro === 'dark' ? 'Tema escuro' : 'Tema claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', outro);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', outro);
  await expect(page.getByRole('button', { name: outro === 'dark' ? 'Tema claro' : 'Tema escuro' })).toBeVisible();
  await semRolagemLateral(page);
});

teste('16. servidor desligado: "Não foi possível carregar." com "Tentar de novo"', async ({ page }) => {
  await page.route('**/api/**', (rota) => rota.abort('connectionrefused'));
  await page.goto('/');
  await expect(page.getByText('Não foi possível carregar.')).toBeVisible();
  await expect(page.getByText('Sem conexão. Não foi possível falar com o servidor.')).toBeVisible();

  // Com o servidor de volta, "Tentar de novo" carrega a escala.
  await page.unroute('**/api/**');
  await page.getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(cartao(page)).toBeVisible();
  await semRolagemLateral(page);
});

teste('17. a vitrine não tem rolagem lateral', async ({ page }) => {
  await page.goto('/vitrine');
  await expect(page.getByRole('heading', { name: 'Vitrine do Design System' })).toBeVisible();
  await semRolagemLateral(page);
});

teste('escala e "Ver tarefas" levam para a sexta certa', async ({ page }) => {
  await page.goto('/escala');
  await expect(page.locator('app-cartao-do-dia')).toHaveCount(4);
  const segunda = page.locator('app-cartao-do-dia').nth(1);
  const titulo = await segunda.locator('.card__title').innerText();
  await segunda.getByRole('link', { name: 'Ver tarefas' }).click();
  await expect(page).toHaveURL(/\/tarefas\?dia=/);
  await expect(page.locator('.card__title').first()).toHaveText(titulo);
  await expect(page.getByRole('link', { name: 'Tarefas' })).toHaveAttribute('aria-current', 'page');
  await semRolagemLateral(page);
});
