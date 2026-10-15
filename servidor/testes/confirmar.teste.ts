import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { MENSAGENS } from '@limpeza/compartilhado';
import { bd } from '../codigo/banco/cliente.js';
import { confirmacoes } from '../codigo/banco/esquema.js';
import { hashDeToken } from '../codigo/comum/seguranca.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, criarDiaPassado, ID_QUE_NAO_EXISTE } from './ajuda/fabricas.js';

const aplicacao = criarAplicacaoDeTeste();

const PEDRO = { nome: 'Pedro Lima', telefone: '(47) 99999-1234', tempo: 'todo', observacao: '' };

function confirmar(diaId: string, dados: object = PEDRO) {
  return request(aplicacao).post(`/api/dias/${diaId}/confirmacoes`).send(dados);
}

beforeEach(limparBanco);

describe('POST /api/dias/:id/confirmacoes', () => {
  it('dados válidos → 201 com pessoaId e código de cancelamento (C7)', async () => {
    const dia = await criarDia();
    const resposta = await confirmar(dia.id);

    expect(resposta.status).toBe(201);
    expect(Object.keys(resposta.body).sort()).toEqual(['codigoCancelamento', 'pessoaId']);
    // 128 bits em base64url = 22 caracteres.
    expect(resposta.body.codigoCancelamento).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('o telefone com máscara é guardado só com números, e o código só como hash', async () => {
    const dia = await criarDia();
    const { body } = await confirmar(dia.id);

    const [linha] = await bd.select().from(confirmacoes).where(eq(confirmacoes.id, body.pessoaId));
    expect(linha?.telefone).toBe('47999991234');
    expect(linha?.observacao).toBeNull();
    expect(linha?.codigoCancelamentoHash).toBe(hashDeToken(body.codigoCancelamento));
    expect(linha?.codigoCancelamentoHash).not.toContain(body.codigoCancelamento);
  });

  it('nome curto e telefone sem DDD → 400 com campos (C1, C2)', async () => {
    const dia = await criarDia();
    const resposta = await confirmar(dia.id, { nome: 'Al', telefone: '99999-1234' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.codigo).toBe('DADOS_INVALIDOS');
    expect(resposta.body.campos).toEqual({ nome: MENSAGENS.nomeCurto, telefone: MENSAGENS.telefoneInvalido });
  });

  it('sexta passada → 409 SEXTA_PASSADA (C3)', async () => {
    const dia = await criarDiaPassado();
    const resposta = await confirmar(dia.id);
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('SEXTA_PASSADA');
  });

  it('sem vaga → 409 SEM_VAGA (C3)', async () => {
    const dia = await criarDia({ vagas: 1 });
    await criarConfirmacao(dia);
    const resposta = await confirmar(dia.id);
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ codigo: 'SEM_VAGA', mensagem: 'As vagas desta sexta acabaram.' });
  });

  it('telefone repetido na mesma sexta → 409; em outra sexta → 201 (C4)', async () => {
    const dia = await criarDia();
    const outroDia = await criarDia();
    expect((await confirmar(dia.id)).status).toBe(201);

    const repetido = await confirmar(dia.id, { ...PEDRO, nome: 'Outro Nome', telefone: '47 99999 1234' });
    expect(repetido.status).toBe(409);
    expect(repetido.body.codigo).toBe('TELEFONE_REPETIDO');

    expect((await confirmar(outroDia.id)).status).toBe(201);
  });

  it('sexta que não existe → 404', async () => {
    const resposta = await confirmar(ID_QUE_NAO_EXISTE);
    expect(resposta.status).toBe(404);
    expect(resposta.body.codigo).toBe('DIA_NAO_ENCONTRADO');
  });
});

describe('Última vaga (C5)', () => {
  it('2 confirmações AO MESMO TEMPO para 1 vaga → exatamente uma 201 e uma 409 SEM_VAGA', async () => {
    const dia = await criarDia({ vagas: 1 });

    const respostas = await Promise.all([
      confirmar(dia.id, { ...PEDRO, telefone: '47911111111' }),
      confirmar(dia.id, { ...PEDRO, nome: 'Paula Reis', telefone: '47922222222' }),
    ]);

    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(respostas.find((r) => r.status === 409)?.body.codigo).toBe('SEM_VAGA');
    const gravadas = await bd.select().from(confirmacoes).where(eq(confirmacoes.diaId, dia.id));
    expect(gravadas).toHaveLength(1);
  });

  it('o mesmo com várias pessoas disputando as 2 últimas vagas', async () => {
    const dia = await criarDia({ vagas: 3 });
    await criarConfirmacao(dia);

    const respostas = await Promise.all(
      Array.from({ length: 6 }, (_, i) => confirmar(dia.id, { ...PEDRO, telefone: `4793333333${i}` })),
    );

    expect(respostas.filter((r) => r.status === 201)).toHaveLength(2);
    expect(respostas.filter((r) => r.status === 409 && r.body.codigo === 'SEM_VAGA')).toHaveLength(4);
  });
});
