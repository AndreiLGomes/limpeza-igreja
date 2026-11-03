/** Organizador: corrigir a presença (L8), cadastrar quem chegou sem celular (L14) e "Encerrar limpeza" (L13). */
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { hoje, MENSAGENS } from '@limpeza/compartilhado';
import { bd } from '../codigo/banco/cliente.js';
import { confirmacoes } from '../codigo/banco/esquema.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, criarDiaPassado, ID_QUE_NAO_EXISTE } from './ajuda/fabricas.js';
import { comoOrganizador } from './ajuda/organizador.js';

const aplicacao = criarAplicacaoDeTeste();
let org: Awaited<ReturnType<typeof comoOrganizador>>;
const ASSINADA = { numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: false, entrada: '19:30', saida: '20:45' };

const corrigir = (diaId: string, pessoaId: string, corpo: object) =>
  org.put(`/api/organizador/dias/${diaId}/pessoas/${pessoaId}/presenca`, corpo);
const assinadoEm = async (id: string) =>
  (await bd.select().from(confirmacoes).where(eq(confirmacoes.id, id)))[0]!.assinadoEm;

beforeEach(async () => {
  await limparBanco();
  org = await comoOrganizador(aplicacao);
});

describe('Corrigir presença (L8)', () => {
  it('corrige em qualquer limpeza, inclusive passada, e devolve a pessoa com os campos novos', async () => {
    const dia = await criarDiaPassado();
    const pessoa = await criarConfirmacao(dia);
    const resposta = await corrigir(dia.id, pessoa.id, ASSINADA);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ ...ASSINADA, assinadoEm: null });
  });

  it('não existe jeito de criar assinatura: "assinado: true" é ignorado', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia);
    await corrigir(dia.id, pessoa.id, { ...ASSINADA, assinado: true, assinadoEm: new Date().toISOString() });
    expect(await assinadoEm(pessoa.id)).toBeNull();
  });

  it('mudar horário ou EPI de quem assinou desfaz a assinatura; mudar só adesão ou código, não', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia, { ...ASSINADA, assinadoEm: new Date() });

    await corrigir(dia.id, pessoa.id, { ...ASSINADA, numeroAdesao: '09', codigoFuncao: '223' });
    expect(await assinadoEm(pessoa.id)).not.toBeNull();

    await corrigir(dia.id, pessoa.id, { ...ASSINADA, recebeuEpi: true });
    expect(await assinadoEm(pessoa.id)).toBeNull();
  });

  it('mudar a saída de quem assinou também desfaz; desfazerAssinatura desfaz sem mudar nada', async () => {
    const dia = await criarDia();
    const uma = await criarConfirmacao(dia, { ...ASSINADA, assinadoEm: new Date() });
    const outra = await criarConfirmacao(dia, { ...ASSINADA, assinadoEm: new Date() });
    await corrigir(dia.id, uma.id, { ...ASSINADA, saida: '21:00' });
    await corrigir(dia.id, outra.id, { ...ASSINADA, desfazerAssinatura: true });
    expect(await assinadoEm(uma.id)).toBeNull();
    expect(await assinadoEm(outra.id)).toBeNull();
  });

  it('saída antes da entrada → 400 com campos.saida; pessoa de outra limpeza → 404', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia);
    const errada = await corrigir(dia.id, pessoa.id, { ...ASSINADA, saida: '19:00' });
    expect(errada.status).toBe(400);
    expect(errada.body.campos).toEqual({ saida: MENSAGENS.saidaAntesDaEntrada });

    const outroDia = await criarDia();
    expect((await corrigir(outroDia.id, pessoa.id, ASSINADA)).body.codigo).toBe('PESSOA_NAO_ENCONTRADA');
  });

  it('sem a senha → 401', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia);
    const resposta = await request(aplicacao)
      .put(`/api/organizador/dias/${dia.id}/pessoas/${pessoa.id}/presenca`)
      .send(ASSINADA);
    expect(resposta.status).toBe(401);
  });
});

describe('Encerrar limpeza (L13)', () => {
  it('grava a saída só em quem tem entrada e não tem saída, sem assinar por ninguém', async () => {
    const dia = await criarDia({ data: hoje() });
    const semSaida = await criarConfirmacao(dia, { entrada: '19:30' });
    const jaSaiu = await criarConfirmacao(dia, { entrada: '19:30', saida: '20:00' });
    const naoVeio = await criarConfirmacao(dia);

    const resposta = await org.post(`/api/organizador/dias/${dia.id}/encerrar`, { saida: '20:45' });
    expect(resposta.status).toBe(200);
    const porId = Object.fromEntries(resposta.body.pessoas.map((p: { id: string }) => [p.id, p]));
    expect(porId[semSaida.id]).toMatchObject({ saida: '20:45', assinadoEm: null });
    expect(porId[jaSaiu.id]).toMatchObject({ saida: '20:00' });
    expect(porId[naoVeio.id]).toMatchObject({ entrada: null, saida: null });
  });

  it('hora antes da entrada de alguém → 409 HORARIO_INVALIDO com o nome, e nada é gravado', async () => {
    const dia = await criarDia({ data: hoje() });
    const cedo = await criarConfirmacao(dia, { entrada: '19:30' });
    await criarConfirmacao(dia, { nome: 'Matheus Bett', entrada: '20:50' });

    const resposta = await org.post(`/api/organizador/dias/${dia.id}/encerrar`, { saida: '20:45' });
    expect(resposta.status).toBe(409);
    expect(resposta.body.mensagem).toBe('Matheus Bett chegou às 20:50, depois dessa hora.');
    expect((await bd.select().from(confirmacoes).where(eq(confirmacoes.id, cedo.id)))[0]!.saida).toBeNull();
  });

  it('sem hora, usa a hora de agora', async () => {
    const dia = await criarDia({ data: hoje() });
    const pessoa = await criarConfirmacao(dia, { entrada: '00:00' });
    const resposta = await org.post(`/api/organizador/dias/${dia.id}/encerrar`, {});
    expect(resposta.status).toBe(200);
    expect(resposta.body.pessoas.find((p: { id: string }) => p.id === pessoa.id).saida).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('Remover quem já marcou presença (protege a assinatura, L7)', () => {
  it('com entrada → 409 PRESENCA_MARCADA e a pessoa continua; depois de apagar a entrada, remove', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia, { entrada: '19:30' });
    const remover = () => org.delete(`/api/organizador/dias/${dia.id}/pessoas/${pessoa.id}`);

    const recusada = await remover();
    expect(recusada.status).toBe(409);
    expect(recusada.body.codigo).toBe('PRESENCA_MARCADA');

    await corrigir(dia.id, pessoa.id, { numeroAdesao: '', codigoFuncao: '', recebeuEpi: null, entrada: '', saida: '' });
    expect((await remover()).status).toBe(200);
  });
});

describe('Adicionar pessoa na presença (L14)', () => {
  const NOVA = { nome: 'Dona Maria', numeroAdesao: '12', codigoFuncao: '222', recebeuEpi: true, entrada: '19:30' };
  const adicionar = (diaId: string, corpo: object) => org.post(`/api/organizador/dias/${diaId}/presenca`, corpo);

  it('sem telefone e já com entrada; não esbarra nas vagas; dois sem telefone cabem', async () => {
    const dia = await criarDia({ vagas: 1 });
    await criarConfirmacao(dia);
    const resposta = await adicionar(dia.id, NOVA);
    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({ nome: 'Dona Maria', telefone: null, entrada: '19:30', saida: null, assinadoEm: null });
    expect((await adicionar(dia.id, { ...NOVA, nome: 'Seu José' })).status).toBe(201);
  });

  it('telefone repetido → 409 TELEFONE_REPETIDO; sem entrada → 400; limpeza que não existe → 404', async () => {
    const dia = await criarDia();
    await criarConfirmacao(dia, { telefone: '47999991234' });
    expect((await adicionar(dia.id, { ...NOVA, telefone: '47 99999-1234' })).body.codigo).toBe('TELEFONE_REPETIDO');
    expect((await adicionar(dia.id, { ...NOVA, entrada: '' })).status).toBe(400);
    expect((await adicionar(ID_QUE_NAO_EXISTE, NOVA)).status).toBe(404);
  });
});
