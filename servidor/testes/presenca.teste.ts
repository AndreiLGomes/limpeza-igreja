/** Presença do voluntário, sem senha (L1–L7, L12). A assinatura é feita na CHEGADA (L5). */
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { FORMATO_HORA, hoje, MENSAGENS } from '@limpeza/compartilhado';
import { bd } from '../codigo/banco/cliente.js';
import { confirmacoes } from '../codigo/banco/esquema.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, ID_QUE_NAO_EXISTE } from './ajuda/fabricas.js';

const aplicacao = criarAplicacaoDeTeste();
const DADOS = { numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true };
const TELEFONE = '47 91111-2222';

const consultar = (diaId: string, telefone = TELEFONE) =>
  request(aplicacao).post(`/api/dias/${diaId}/presenca/consultar`).send({ telefone });
const chegar = (diaId: string, extra: object = {}) =>
  request(aplicacao).post(`/api/dias/${diaId}/presenca/entrada`).send({ telefone: TELEFONE, ...DADOS, ...extra });
const sair = (diaId: string, telefone = TELEFONE) =>
  request(aplicacao).post(`/api/dias/${diaId}/presenca/saida`).send({ telefone });
const linha = async (id: string) => (await bd.select().from(confirmacoes).where(eq(confirmacoes.id, id)))[0]!;

/** A limpeza de hoje, com a Célia confirmada (telefone 47 91111-2222). */
async function limpezaDeHojeComCelia() {
  const dia = await criarDia({ data: hoje() });
  const celia = await criarConfirmacao(dia, { nome: 'Célia Gomes', telefone: '47911112222' });
  return { dia, celia };
}

beforeEach(limparBanco);

describe('Cheguei (L1, L3, L4, L5)', () => {
  it('confirmada: grava adesão, código, EPI, a entrada pelo relógio do servidor e a ASSINATURA', async () => {
    const { dia, celia } = await limpezaDeHojeComCelia();
    const resposta = await chegar(dia.id);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ estado: 'chegou', primeiroNome: 'Célia', saida: null });
    expect(resposta.body.entrada).toMatch(FORMATO_HORA);
    expect(Date.parse(resposta.body.assinadoEm)).not.toBeNaN();
    expect(await linha(celia.id)).toMatchObject({ numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true });
    expect((await linha(celia.id)).assinadoEm).not.toBeNull();
  });

  it('o organizador marcou a chegada (sem assinatura): o Cheguei assina e mantém a entrada dele', async () => {
    const { dia, celia } = await limpezaDeHojeComCelia();
    await bd.update(confirmacoes).set({ entrada: '19:10' }).where(eq(confirmacoes.id, celia.id));
    const resposta = await chegar(dia.id);
    expect(resposta.body).toMatchObject({ estado: 'chegou', entrada: '19:10' });
    expect((await linha(celia.id)).assinadoEm).not.toBeNull();
  });

  it('sem confirmar e sem nome → 400 NOME_OBRIGATORIO com campos.nome; com nome, entra na lista', async () => {
    const dia = await criarDia({ data: hoje() });
    const semNome = await chegar(dia.id);
    expect(semNome.status).toBe(400);
    expect(semNome.body.codigo).toBe('NOME_OBRIGATORIO');
    expect(semNome.body.campos).toEqual({ nome: semNome.body.mensagem });

    const comNome = await chegar(dia.id, { nome: 'Matheus Bett' });
    expect(comNome.status).toBe(200);
    expect(comNome.body).toMatchObject({ estado: 'chegou', primeiroNome: 'Matheus' });
  });

  it('sem confirmar entra mesmo com as vagas cheias (L3)', async () => {
    const dia = await criarDia({ data: hoje(), vagas: 1 });
    await criarConfirmacao(dia);
    expect((await chegar(dia.id, { nome: 'Matheus Bett' })).status).toBe(200);
  });

  it('tocar de novo não muda nada e não devolve horários (L5, L12)', async () => {
    const { dia, celia } = await limpezaDeHojeComCelia();
    await chegar(dia.id);
    const antes = await linha(celia.id);
    const deNovo = await chegar(dia.id, { numeroAdesao: '99', recebeuEpi: false });
    expect(deNovo.status).toBe(200);
    expect(deNovo.body).toEqual({ estado: 'chegou', primeiroNome: 'Célia', entrada: null, saida: null, assinadoEm: null });
    expect(await linha(celia.id)).toMatchObject({ numeroAdesao: '08', recebeuEpi: true, entrada: antes.entrada });
  });

  it('em outro dia → 409 NAO_E_HOJE; limpeza que não existe → 404', async () => {
    const amanha = await criarDia();
    expect((await chegar(amanha.id)).body.codigo).toBe('NAO_E_HOJE');
    expect((await chegar(ID_QUE_NAO_EXISTE)).status).toBe(404);
  });

  it('dados inválidos → 400 com campos', async () => {
    const { dia } = await limpezaDeHojeComCelia();
    const resposta = await chegar(dia.id, { numeroAdesao: 'abc' });
    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ numeroAdesao: MENSAGENS.adesaoInvalida });
  });
});

describe('Saí (L6, L7)', () => {
  it('grava só a saída (a assinatura foi na chegada); tocar de novo → JA_SAIU', async () => {
    const { dia, celia } = await limpezaDeHojeComCelia();
    const chegada = await chegar(dia.id);
    const resposta = await sair(dia.id);
    expect(resposta.status).toBe(200);
    expect(resposta.body.estado).toBe('saiu');
    expect(resposta.body.saida).toMatch(FORMATO_HORA);
    expect(resposta.body.assinadoEm).toBe(chegada.body.assinadoEm);

    expect((await sair(dia.id)).body.codigo).toBe('JA_SAIU');
    const deNovo = await chegar(dia.id);
    expect(deNovo.body).toMatchObject({ estado: 'saiu', entrada: null, saida: null });
    expect((await linha(celia.id)).saida).not.toBeNull();
  });

  it('sem entrada → 409 SEM_ENTRADA; telefone fora da lista → 404 TELEFONE_NAO_CONFERE', async () => {
    const { dia } = await limpezaDeHojeComCelia();
    expect((await sair(dia.id)).body.codigo).toBe('SEM_ENTRADA');
    expect((await sair(dia.id, '47 98888-7777')).body.codigo).toBe('TELEFONE_NAO_CONFERE');
  });

  it('se o "Encerrar limpeza" já gravou a saída, o Saí responde JA_SAIU e a saída fica (L13)', async () => {
    const { dia, celia } = await limpezaDeHojeComCelia();
    await bd.update(confirmacoes).set({ entrada: '19:30', saida: '20:45' }).where(eq(confirmacoes.id, celia.id));
    expect((await sair(dia.id)).body.codigo).toBe('JA_SAIU');
    expect((await linha(celia.id)).saida).toBe('20:45:00');
  });
});

describe('Consultar (L12)', () => {
  it('devolve só o estado e o primeiro nome, nunca horários nem adesão', async () => {
    const { dia } = await limpezaDeHojeComCelia();
    expect((await consultar(dia.id)).body).toEqual({
      estado: 'fora', primeiroNome: 'Célia', entrada: null, saida: null, assinadoEm: null,
    });
    await chegar(dia.id);
    const depois = await consultar(dia.id);
    expect(depois.body).toEqual({ estado: 'chegou', primeiroNome: 'Célia', entrada: null, saida: null, assinadoEm: null });
    expect(JSON.stringify(depois.body)).not.toContain('08');
  });

  it('telefone fora da lista: estado "fora" e sem nome', async () => {
    const { dia } = await limpezaDeHojeComCelia();
    expect((await consultar(dia.id, '47 98888-7777')).body).toEqual({
      estado: 'fora', primeiroNome: null, entrada: null, saida: null, assinadoEm: null,
    });
  });
});
