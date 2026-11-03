import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { CANCELAMENTO_BLOQUEIO_SEGUNDOS, CANCELAMENTO_TENTATIVAS_MAX } from '@limpeza/compartilhado';
import { bd } from '../codigo/banco/cliente.js';
import { confirmacoes } from '../codigo/banco/esquema.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, criarDiaPassado } from './ajuda/fabricas.js';

const aplicacao = criarAplicacaoDeTeste();

async function existe(id: string): Promise<boolean> {
  return (await bd.select().from(confirmacoes).where(eq(confirmacoes.id, id))).length > 0;
}

const cancelarPorCodigo = (codigoCancelamento: string) =>
  request(aplicacao).post('/api/confirmacoes/cancelar').send({ codigoCancelamento });

const cancelarPorTelefone = (diaId: string, telefone: string) =>
  request(aplicacao).post(`/api/dias/${diaId}/confirmacoes/cancelar-por-telefone`).send({ telefone });

beforeEach(limparBanco);

describe('Cancelar pelo código (X1, X4)', () => {
  it('código certo → 204 e a pessoa some', async () => {
    const pessoa = await criarConfirmacao(await criarDia());
    const resposta = await cancelarPorCodigo(pessoa.codigo);
    expect(resposta.status).toBe(204);
    expect(await existe(pessoa.id)).toBe(false);
  });

  it('código errado → 404 CODIGO_INVALIDO', async () => {
    await criarConfirmacao(await criarDia());
    const resposta = await cancelarPorCodigo('codigo-que-nao-existe');
    expect(resposta.status).toBe(404);
    expect(resposta.body.codigo).toBe('CODIGO_INVALIDO');
  });

  it('o mesmo código não cancela duas vezes (o celular apenas esquece o código, X6)', async () => {
    const pessoa = await criarConfirmacao(await criarDia());
    await cancelarPorCodigo(pessoa.codigo);
    expect((await cancelarPorCodigo(pessoa.codigo)).body.codigo).toBe('CODIGO_INVALIDO');
  });

  it('limpeza passada → 409 LIMPEZA_PASSADA e a pessoa continua lá', async () => {
    const pessoa = await criarConfirmacao(await criarDiaPassado());
    const resposta = await cancelarPorCodigo(pessoa.codigo);
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('LIMPEZA_PASSADA');
    expect(await existe(pessoa.id)).toBe(true);
  });

  it('sem código → 400', async () => {
    const resposta = await request(aplicacao).post('/api/confirmacoes/cancelar').send({});
    expect(resposta.status).toBe(400);
  });
});

describe('Cancelar pelo telefone (X2, X3, X4)', () => {
  it('telefone certo (com ou sem máscara) → 204', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia, { telefone: '47999991234' });
    const resposta = await cancelarPorTelefone(dia.id, '(47) 99999-1234');
    expect(resposta.status).toBe(204);
    expect(await existe(pessoa.id)).toBe(false);
  });

  it('telefone errado → 404 TELEFONE_NAO_CONFERE, com a mensagem das regras', async () => {
    const dia = await criarDia();
    await criarConfirmacao(dia, { telefone: '47999991234' });
    const resposta = await cancelarPorTelefone(dia.id, '47988887777');
    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      codigo: 'TELEFONE_NAO_CONFERE',
      mensagem: 'Esse telefone não confere com nenhuma confirmação desta limpeza.',
    });
  });

  it('só cancela a confirmação DAQUELA limpeza', async () => {
    const dia = await criarDia();
    const outroDia = await criarDia();
    const pessoa = await criarConfirmacao(outroDia, { telefone: '47999991234' });
    expect((await cancelarPorTelefone(dia.id, '47999991234')).status).toBe(404);
    expect(await existe(pessoa.id)).toBe(true);
  });

  it('limpeza passada → 409', async () => {
    const dia = await criarDiaPassado();
    await criarConfirmacao(dia, { telefone: '47999991234' });
    expect((await cancelarPorTelefone(dia.id, '47999991234')).body.codigo).toBe('LIMPEZA_PASSADA');
  });

  it('telefone inválido → 400 (não conta como tentativa errada)', async () => {
    const dia = await criarDia();
    expect((await cancelarPorTelefone(dia.id, '123')).status).toBe(400);
  });

  it('6ª tentativa errada → 429 MUITAS_TENTATIVAS; até o telefone certo fica bloqueado', async () => {
    const dia = await criarDia();
    await criarConfirmacao(dia, { telefone: '47999991234' });

    for (let i = 1; i <= CANCELAMENTO_TENTATIVAS_MAX; i++) {
      expect((await cancelarPorTelefone(dia.id, `4798888777${i}`)).status, `tentativa ${i}`).toBe(404);
    }

    const bloqueada = await cancelarPorTelefone(dia.id, '47988887770');
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.codigo).toBe('MUITAS_TENTATIVAS');
    expect(bloqueada.body.tentarEmSegundos).toBeGreaterThan(CANCELAMENTO_BLOQUEIO_SEGUNDOS - 30);
    expect(bloqueada.body.tentarEmSegundos).toBeLessThanOrEqual(CANCELAMENTO_BLOQUEIO_SEGUNDOS);

    expect((await cancelarPorTelefone(dia.id, '47999991234')).status).toBe(429);
  });

  it('acertos não contam como tentativa errada', async () => {
    const dia = await criarDia();
    for (let i = 1; i <= CANCELAMENTO_TENTATIVAS_MAX + 1; i++) {
      await criarConfirmacao(dia, { telefone: `4791111111${i}` });
      expect((await cancelarPorTelefone(dia.id, `4791111111${i}`)).status).toBe(204);
    }
  });
});
