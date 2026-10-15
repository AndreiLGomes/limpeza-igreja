/**
 * LGPD (P1, P2, P4).
 * - Nenhuma resposta pública devolve telefone nem observação, INCLUSIVE as de erro.
 * - O log do servidor não guarda nome, telefone nem código de cancelamento.
 */
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ROTAS } from '@limpeza/shared';
import { criarLog } from '../src/http/log.js';
import { criarAppDeTeste } from './ajuda/app.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, criarDiaPassado, criarTarefa } from './ajuda/fabricas.js';

const TELEFONE = '47999991234';
const TELEFONE_FORMATADO = '47 99999-1234';
const OBSERVACAO = 'moro na rua das flores 123';
const ID_INEXISTENTE = '6f1c1b0e-8a3e-4c1a-9b7d-2f4e5a6b7c8d';

/** Procura chaves proibidas em qualquer nível, menos dentro de `campos` (nomes de campo com erro). */
function chavesProibidas(valor: unknown, caminho = 'resposta'): string[] {
  if (Array.isArray(valor)) return valor.flatMap((item, i) => chavesProibidas(item, `${caminho}[${i}]`));
  if (typeof valor !== 'object' || valor === null) return [];
  return Object.entries(valor).flatMap(([chave, filho]) => {
    if (chave === 'campos') return [];
    const aqui = ['telefone', 'observacao'].includes(chave) ? [`${caminho}.${chave}`] : [];
    return [...aqui, ...chavesProibidas(filho, `${caminho}.${chave}`)];
  });
}

beforeEach(limparBanco);

describe('P1, P2: nenhum endereço público devolve telefone nem observação', () => {
  it('percorre todos os endereços públicos, nas respostas certas e nas de erro', async () => {
    const app = criarAppDeTeste();
    const dia = await criarDia({ vagas: 3 });
    const diaCheio = await criarDia({ vagas: 1 });
    const diaPassado = await criarDiaPassado();
    const tarefa = await criarTarefa(dia);
    await criarConfirmacao(dia, { telefone: TELEFONE, observacao: OBSERVACAO });
    await criarConfirmacao(diaCheio, { telefone: TELEFONE, observacao: OBSERVACAO });
    const outraPessoa = await criarConfirmacao(dia, { telefone: '47900000009' });

    const confirmar = (id: string, telefone: string) =>
      request(app).post(`/api/dias/${id}/confirmacoes`).send({ nome: 'Ana Souza', telefone, observacao: OBSERVACAO });
    const porTelefone = (id: string, telefone: string) =>
      request(app).post(`/api/dias/${id}/confirmacoes/cancelar-por-telefone`).send({ telefone });
    const marcar = (tarefaId: string, corpo: object) =>
      request(app).patch(`/api/dias/${dia.id}/tarefas/${tarefaId}`).send(corpo);

    /** [endereço do docs/04, status esperado, requisição] */
    const casos: [string, number, () => request.Test][] = [
      [ROTAS.saude, 200, () => request(app).get('/api/saude')],
      [ROTAS.dias, 200, () => request(app).get('/api/dias')],
      [ROTAS.dia(':id'), 200, () => request(app).get(`/api/dias/${dia.id}`)],
      [ROTAS.dia(':id'), 404, () => request(app).get(`/api/dias/${ID_INEXISTENTE}`)],
      [ROTAS.confirmar(':id'), 400, () => confirmar(dia.id, TELEFONE.slice(0, 9))],
      [ROTAS.confirmar(':id'), 409, () => confirmar(dia.id, TELEFONE)], // telefone repetido
      [ROTAS.confirmar(':id'), 409, () => confirmar(diaCheio.id, '47911111111')], // sem vaga
      [ROTAS.confirmar(':id'), 409, () => confirmar(diaPassado.id, '47911111111')],
      [ROTAS.confirmar(':id'), 201, () => confirmar(dia.id, '47911111111')],
      [ROTAS.cancelarPorCodigo, 404, () => request(app).post('/api/confirmacoes/cancelar').send({ codigoCancelamento: 'x' })],
      [ROTAS.cancelarPorCodigo, 400, () => request(app).post('/api/confirmacoes/cancelar').send({})],
      [ROTAS.cancelarPorTelefone(':id'), 400, () => porTelefone(dia.id, '123')],
      [ROTAS.cancelarPorTelefone(':id'), 404, () => porTelefone(dia.id, '47988887777')],
      [ROTAS.cancelarPorTelefone(':id'), 409, () => porTelefone(diaPassado.id, TELEFONE)],
      [ROTAS.cancelarPorTelefone(':id'), 204, () => porTelefone(dia.id, outraPessoa.telefone)],
      [ROTAS.tarefa(':id', ':tarefaId'), 200, () => marcar(tarefa.id, { feita: true })],
      [ROTAS.tarefa(':id', ':tarefaId'), 400, () => marcar(tarefa.id, { feita: 'sim' })],
      [ROTAS.tarefa(':id', ':tarefaId'), 404, () => marcar(ID_INEXISTENTE, { feita: true })],
      ['/nao-existe', 404, () => request(app).get('/api/nao-existe')],
      // Por último: a escala depois de tudo, com as pessoas novas.
      [ROTAS.dias, 200, () => request(app).get('/api/dias')],
    ];

    for (const [endereco, status, fazer] of casos) {
      const resposta = await fazer();
      const texto = JSON.stringify(resposta.body);
      expect(resposta.status, endereco).toBe(status);
      expect(chavesProibidas(resposta.body), endereco).toEqual([]);
      for (const proibido of [TELEFONE, TELEFONE_FORMATADO, OBSERVACAO]) {
        expect(texto, `${endereco} (${status})`).not.toContain(proibido);
      }
    }

    // Todos os endereços públicos do docs/04 foram visitados.
    const publicos = [
      ROTAS.saude, ROTAS.dias, ROTAS.dia(':id'), ROTAS.confirmar(':id'), ROTAS.cancelarPorCodigo,
      ROTAS.cancelarPorTelefone(':id'), ROTAS.tarefa(':id', ':tarefaId'),
    ];
    const visitados = new Set(casos.map(([endereco]) => endereco));
    expect(publicos.filter((endereco) => !visitados.has(endereco))).toEqual([]);
  });
});

describe('P4: o log não registra dados pessoais', () => {
  it('confirmar e cancelar não deixam nome, telefone nem código no log', async () => {
    const linhas: string[] = [];
    const app = criarAppDeTeste({ log: criarLog('info', { write: (linha: string) => linhas.push(linha) }) });
    const dia = await criarDia();
    const nome = 'Fulana Registrada Silva';

    const confirmada = await request(app)
      .post(`/api/dias/${dia.id}/confirmacoes?telefone=${TELEFONE}`)
      .send({ nome, telefone: TELEFONE_FORMATADO, observacao: OBSERVACAO });
    expect(confirmada.status).toBe(201);
    const codigo: string = confirmada.body.codigoCancelamento;

    await request(app).post(`/api/dias/${dia.id}/confirmacoes/cancelar-por-telefone`).send({ telefone: '47988887777' });
    expect((await request(app).post('/api/confirmacoes/cancelar').send({ codigoCancelamento: codigo })).status).toBe(204);

    const log = linhas.join('\n');
    expect(linhas.length).toBeGreaterThanOrEqual(3);
    expect(log).toContain('/confirmacoes');
    for (const proibido of [nome, TELEFONE, TELEFONE_FORMATADO, '47988887777', OBSERVACAO, codigo]) {
      expect(log).not.toContain(proibido);
    }
  });
});
