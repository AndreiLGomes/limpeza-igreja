/** A folha de presença e o cabeçalho da folha (L10, L11). */
import { hoje } from '@limpeza/compartilhado';
import { criarLimpezaDeHoje, marcarChegada } from './ajuda/api';
import { entrarComoOrganizador, expect, notificacao, semRolagemLateral, teste } from './ajuda/teste';

const CABECALHO = { local: 'Taiti', setor: 'Sede / Escolinha', atividades: 'Limpeza', tipoDeServico: 'apoio' };

teste('cabeçalho: "usar como padrão" faz a próxima limpeza nova já vir preenchida', async ({ page }) => {
  await entrarComoOrganizador(page);
  await page.goto('/organizar/limpeza/nova');
  // Hoje nunca tem limpeza nos dados de exemplo (a primeira é depois de amanhã).
  await page.getByLabel('Data').fill(hoje());
  await page.getByLabel('Local').fill('Taiti');
  await page.getByLabel('Atividades').fill('Limpeza');
  await page.getByLabel('Construção').check();
  await page.getByLabel('Usar como padrão nas próximas limpezas').check();
  await semRolagemLateral(page);
  await page.getByRole('button', { name: 'Salvar limpeza' }).click();
  await expect(notificacao(page, /Limpeza criada/)).toBeVisible();

  await page.goto('/organizar/limpeza/nova');
  await expect(page.getByLabel('Local')).toHaveValue('Taiti');
  await expect(page.getByLabel('Atividades')).toHaveValue('Limpeza');
  await expect(page.getByLabel('Construção')).toBeChecked();
});

teste('folha: cabeçalho, quem veio com X no EPI, assinatura do app e linhas em branco @escuro', async ({ page }) => {
  const diaId = await criarLimpezaDeHoje([{ nome: 'Célia Gomes', telefone: '47911112222' }], CABECALHO);
  await marcarChegada(diaId, '47911112222');
  await entrarComoOrganizador(page);
  await page.goto(`/organizar/limpeza/${diaId}`);
  await page.getByRole('link', { name: 'Imprimir folha' }).click();

  await expect(page).toHaveURL(new RegExp(`/organizar/limpeza/${diaId}/folha$`));
  await expect(page.locator('.appbar')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /LISTA DE PRESENÇA/ })).toBeVisible();
  await expect(page.getByText('Taiti')).toBeVisible();
  const linhas = page.locator('tbody tr');
  await expect(linhas).toHaveCount(15);
  await expect(linhas.first()).toContainText('Célia Gomes');
  await expect(linhas.first()).toContainText(/Assinado no app em \d{2}\/\d{2} às \d{2}:\d{2}/);
  await expect(linhas.nth(1)).not.toContainText('Assinado');
  await expect(page.locator('body')).not.toContainText('91111-2222');
  await semRolagemLateral(page);
});

teste('folha impressa: sempre clara, 2 páginas com muita gente e o cabeçalho das colunas repetido @escuro', async ({ page }) => {
  const diaId = await criarLimpezaDeHoje();
  // 40 pessoas só na resposta (sem gravar): não esbarra no limite de escritas e dá 2 páginas com certeza.
  const pessoas = Array.from({ length: 40 }, (_, i) => ({
    id: `p${i}`, nome: `Pessoa ${i + 1}`, tempo: 'todo', telefone: null, observacao: null, criadoEm: '',
    numeroAdesao: String(i + 1), codigoFuncao: '222', recebeuEpi: true, entrada: '19:00', saida: null, assinadoEm: null,
  }));
  await page.route(`**/api/organizador/dias/${diaId}`, async (rota) => {
    const resposta = await rota.fetch();
    await rota.fulfill({ response: resposta, json: { ...(await resposta.json()), pessoas } });
  });
  await entrarComoOrganizador(page);
  await page.goto(`/organizar/limpeza/${diaId}/folha`);
  await expect(page.locator('tbody tr')).toHaveCount(40);

  await page.emulateMedia({ media: 'print' });
  // No tema escuro também: a folha impressa tem o fundo do tema claro (bg #ffffff do tokens.json).
  expect(await page.locator('.folha').evaluate((elemento) => getComputedStyle(elemento).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.locator('thead').evaluate((elemento) => getComputedStyle(elemento).display)).toBe('table-header-group');
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeHidden();
  // O próprio PDF declara o total de páginas no objeto /Type /Pages ("/Count N").
  const pdf = (await page.pdf({ preferCSSPageSize: true })).toString('latin1');
  const contagem = /\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/.exec(pdf) ?? /\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/.exec(pdf);
  expect(Number(contagem?.[1])).toBeGreaterThanOrEqual(2);
});
