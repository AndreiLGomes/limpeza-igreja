/**
 * Lista de presença de ponta a ponta (desenho da Parte 2a). Cada teste cria a limpeza de HOJE pela API.
 * O banco volta aos dados de exemplo antes de cada teste (ajuda/teste.ts).
 */
import type { Locator, Page } from '@playwright/test';
import { criarLimpezaDeHoje, marcarChegada } from './ajuda/api';
import { entrarComoOrganizador, expect, notificacao, semRolagemLateral, teste } from './ajuda/teste';

const CELIA = { nome: 'Célia Gomes', telefone: '47911112222' };

/** Preenche o formulário da presença, na tela ou dentro de uma janela (sem enviar). */
async function preencherPresenca(
  onde: Page | Locator, telefone: string, adesao: string, epi: 'Sim' | 'Não',
): Promise<void> {
  await onde.getByLabel('Telefone').fill(telefone);
  await onde.getByLabel('Nº de adesão').fill(adesao);
  await onde.getByLabel('Código da função').fill('222');
  await onde.getByLabel(epi, { exact: true }).check();
}

teste('presença: Cheguei, Saí e Confirmo; ao recarregar, continua assinada @escuro', async ({ page }) => {
  const diaId = await criarLimpezaDeHoje([CELIA]);
  await page.goto('/');
  await page.getByRole('link', { name: 'Marcar presença' }).first().click();
  await expect(page).toHaveURL(new RegExp(`/presenca\\?dia=${diaId}`));

  await preencherPresenca(page, '47 91111-2222', '08', 'Sim');
  await semRolagemLateral(page);
  await page.getByRole('button', { name: 'Cheguei' }).click();

  await expect(page.getByRole('heading', { name: 'Olá, Célia' })).toBeVisible();
  await expect(page.getByText(/^Entrada: \d{2}:\d{2}$/)).toBeVisible();
  await page.getByRole('button', { name: 'Saí' }).click();
  const janela = page.getByRole('dialog', { name: 'Confirmar sua presença?' });
  await expect(janela).toContainText(/a partir das \d{2}:\d{2}\./);
  await expect(janela.getByRole('button', { name: 'Voltar' })).toBeFocused();
  await janela.getByRole('button', { name: 'Confirmo' }).click();

  await expect(page.getByText(/^Presença assinada às \d{2}:\d{2}\. Obrigado!$/)).toBeVisible();
  await page.reload();
  await expect(page.getByText('Presença assinada', { exact: true })).toBeVisible();
  await semRolagemLateral(page);
});

teste('presença: quem não confirmou antes escreve o nome e entra na lista', async ({ page }) => {
  const diaId = await criarLimpezaDeHoje();
  await page.goto(`/presenca?dia=${diaId}`);
  await preencherPresenca(page, '47 92222-3333', '03', 'Não');
  await page.getByRole('button', { name: 'Cheguei' }).click();

  await expect(page.getByText('Você ainda não está na lista desta limpeza. Escreva seu nome.')).toBeVisible();
  await page.getByLabel('Seu nome').fill('Matheus Bett');
  await page.getByRole('button', { name: 'Cheguei' }).click();
  await expect(page.getByRole('heading', { name: 'Olá, Matheus' })).toBeVisible();
});

teste('presença: "Não sou eu" esquece os dados deste celular', async ({ page }) => {
  const diaId = await criarLimpezaDeHoje([CELIA]);
  await page.goto(`/presenca?dia=${diaId}`);
  await preencherPresenca(page, '47 91111-2222', '08', 'Sim');
  await page.getByRole('button', { name: 'Cheguei' }).click();
  await expect(page.getByRole('heading', { name: 'Olá, Célia' })).toBeVisible();

  await page.getByRole('button', { name: 'Não sou eu' }).click();
  await expect(page.getByLabel('Telefone')).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('Telefone')).toHaveValue('');
});

teste('presença: fora do dia da limpeza, a tela explica', async ({ page }) => {
  await page.goto('/presenca');
  await expect(page.getByText('A presença só pode ser marcada no dia da limpeza.')).toBeVisible();
});

teste('organizador: vê a lista, corrige o EPI e usa "Encerrar limpeza"', async ({ page }) => {
  const diaId = await criarLimpezaDeHoje([CELIA]);
  await marcarChegada(diaId, CELIA.telefone);
  await entrarComoOrganizador(page);
  await page.goto(`/organizar/limpeza/${diaId}`);

  await expect(page.getByRole('heading', { name: 'Lista de presença' })).toBeVisible();
  await expect(page.getByText(/Adesão 08 · Função 222 · EPI: sim · chegou às \d{2}:\d{2} · assina no papel/)).toBeVisible();

  await page.getByRole('button', { name: /Célia Gomes/ }).click();
  const corrigir = page.getByRole('dialog', { name: 'Corrigir presença de Célia Gomes' });
  await corrigir.getByLabel('Não', { exact: true }).check();
  await corrigir.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(notificacao(page, 'Presença de Célia Gomes corrigida.')).toBeVisible();
  await expect(page.getByText(/EPI: não/)).toBeVisible();

  await page.getByRole('button', { name: 'Encerrar limpeza' }).click();
  const encerrar = page.getByRole('dialog', { name: 'Encerrar a limpeza?' });
  await expect(encerrar).toContainText('1 pessoa que não saiu');
  await encerrar.getByRole('button', { name: 'Encerrar' }).click();
  await expect(notificacao(page, 'Saída marcada para quem ainda não tinha saído.')).toBeVisible();
  await expect(page.getByText(/\d{2}:\d{2} às \d{2}:\d{2} · assina no papel/)).toBeVisible();
  await semRolagemLateral(page);
});

teste('organizador: cadastra quem chegou sem celular, direto na lista de presença', async ({ page }) => {
  const diaId = await criarLimpezaDeHoje();
  await entrarComoOrganizador(page);
  await page.goto(`/organizar/limpeza/${diaId}`);
  await page.getByRole('button', { name: 'Adicionar pessoa' }).click();
  // Tudo dentro da janela: a tela da limpeza tem o próprio "Salvar limpeza" e outros campos.
  const janela = page.getByRole('dialog', { name: 'Adicionar pessoa' });
  // O rótulo é "Nome *" (obrigatório); o nome acessível do campo é "Nome".
  await janela.getByRole('textbox', { name: 'Nome', exact: true }).fill('Dona Maria');
  await preencherPresenca(janela, '', '12', 'Sim');
  await janela.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(notificacao(page, 'Dona Maria entrou na lista de presença.')).toBeVisible();
  await expect(page.getByText(/Adesão 12 · Função 222 · EPI: sim · chegou às \d{2}:\d{2} · assina no papel/)).toBeVisible();
});
