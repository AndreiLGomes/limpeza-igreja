import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { bd } from '../codigo/banco/cliente.js';
import { tarefas } from '../codigo/banco/esquema.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { limparBanco } from './ajuda/banco.js';
import { criarDia, criarDiaPassado, criarTarefa, ID_QUE_NAO_EXISTE } from './ajuda/fabricas.js';

const aplicacao = criarAplicacaoDeTeste();

const marcar = (diaId: string, tarefaId: string, corpo: object) =>
  request(aplicacao).patch(`/api/dias/${diaId}/tarefas/${tarefaId}`).send(corpo);

beforeEach(limparBanco);

describe('PATCH /api/dias/:id/tarefas/:tarefaId (T1, T2)', () => {
  it('qualquer pessoa marca e desmarca → 200 com a tarefa', async () => {
    const dia = await criarDia();
    const tarefa = await criarTarefa(dia, { nome: 'Varrer o salão' });

    const marcada = await marcar(dia.id, tarefa.id, { feita: true });
    expect(marcada.status).toBe(200);
    expect(marcada.body).toEqual({ id: tarefa.id, nome: 'Varrer o salão', feita: true });
    const [noBanco] = await bd.select().from(tarefas).where(eq(tarefas.id, tarefa.id));
    expect(noBanco?.feitaEm).toBeInstanceOf(Date);

    const desmarcada = await marcar(dia.id, tarefa.id, { feita: false });
    expect(desmarcada.body.feita).toBe(false);
    const [depois] = await bd.select().from(tarefas).where(eq(tarefas.id, tarefa.id));
    expect(depois?.feitaEm).toBeNull();
  });

  it('limpeza passada → 409 LIMPEZA_PASSADA', async () => {
    const dia = await criarDiaPassado();
    const tarefa = await criarTarefa(dia);
    const resposta = await marcar(dia.id, tarefa.id, { feita: true });
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('LIMPEZA_PASSADA');
  });

  it('tarefa de outra limpeza ou que não existe → 404 TAREFA_NAO_ENCONTRADA', async () => {
    const dia = await criarDia();
    const tarefaDeOutroDia = await criarTarefa(await criarDia());
    for (const tarefaId of [tarefaDeOutroDia.id, ID_QUE_NAO_EXISTE, 'abc']) {
      const resposta = await marcar(dia.id, tarefaId, { feita: true });
      expect(resposta.status, tarefaId).toBe(404);
      expect(resposta.body.codigo, tarefaId).toBe('TAREFA_NAO_ENCONTRADA');
    }
  });

  it('"feita" que não é verdadeiro/falso → 400', async () => {
    const dia = await criarDia();
    const tarefa = await criarTarefa(dia);
    expect((await marcar(dia.id, tarefa.id, { feita: 'sim' })).status).toBe(400);
  });
});
