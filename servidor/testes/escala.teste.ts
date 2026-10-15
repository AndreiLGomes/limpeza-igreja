import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { somarDias } from '@limpeza/compartilhado';
import { hoje } from '../codigo/comum/tempo.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, criarDiaPassado, criarTarefa } from './ajuda/fabricas.js';

const aplicacao = criarAplicacaoDeTeste();

beforeEach(limparBanco);

describe('GET /api/dias (S12, D2)', () => {
  it('só sextas de hoje em diante, em ordem, no máximo 8; a de hoje aparece e a de ontem não', async () => {
    await criarDiaPassado();
    // Cria fora de ordem para conferir que a resposta vem ordenada.
    for (const dias of [9, 3, 0, 1, 7, 2, 8, 4, 6, 5]) await criarDia({ data: somarDias(hoje(), dias) });

    const resposta = await request(aplicacao).get('/api/dias');
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((dia: { data: string }) => dia.data)).toEqual(
      [0, 1, 2, 3, 4, 5, 6, 7].map((dias) => somarDias(hoje(), dias)),
    );
  });

  it('lista vazia quando não há sextas', async () => {
    const resposta = await request(aplicacao).get('/api/dias');
    expect(resposta.body).toEqual([]);
  });

  it('cada sexta vem no formato do docs/04: horas curtas, pessoas em ordem e tarefas em ordem', async () => {
    const dia = await criarDia({ inicio: '19:30', fim: '21:00', vagas: 3 });
    const primeira = await criarConfirmacao(dia, { nome: 'Ana Souza', tempo: 'primeira-hora' });
    const segunda = await criarConfirmacao(dia, { nome: 'Bruno Lima' });
    const tarefaB = await criarTarefa(dia, { nome: 'Tirar o lixo', ordem: 1 });
    const tarefaA = await criarTarefa(dia, { nome: 'Varrer o salão', ordem: 0 });

    const [recebido] = (await request(aplicacao).get('/api/dias')).body;
    expect(recebido).toEqual({
      id: dia.id,
      data: dia.data,
      inicio: '19:30',
      fim: '21:00',
      vagas: 3,
      pessoas: [
        { id: primeira.id, nome: 'Ana Souza', tempo: 'primeira-hora' },
        { id: segunda.id, nome: 'Bruno Lima', tempo: 'todo' },
      ],
      tarefas: [
        { id: tarefaA.id, nome: 'Varrer o salão', feita: false },
        { id: tarefaB.id, nome: 'Tirar o lixo', feita: false },
      ],
    });
  });
});

describe('GET /api/dias/:id', () => {
  it('devolve a sexta', async () => {
    const dia = await criarDia();
    const resposta = await request(aplicacao).get(`/api/dias/${dia.id}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(dia.id);
  });

  it('404 DIA_NAO_ENCONTRADO para id que não existe ou que nem é um id', async () => {
    for (const id of ['6f1c1b0e-8a3e-4c1a-9b7d-2f4e5a6b7c8d', 'abc']) {
      const resposta = await request(aplicacao).get(`/api/dias/${id}`);
      expect(resposta.status, id).toBe(404);
      expect(resposta.body.codigo, id).toBe('DIA_NAO_ENCONTRADO');
    }
  });
});
