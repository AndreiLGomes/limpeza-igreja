/** Organizador: limpezas e pessoas (S1–S13, O5). */
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { CABECALHO_VAZIO, hoje, MENSAGENS, mensagemDoErro, proximoDiaDaSemana, somarDias } from '@limpeza/compartilhado';
import { bd } from '../codigo/banco/cliente.js';
import { confirmacoes, dias, tarefas } from '../codigo/banco/esquema.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, criarDiaPassado, criarTarefa, ID_QUE_NAO_EXISTE } from './ajuda/fabricas.js';
import { comoOrganizador } from './ajuda/organizador.js';

const aplicacao = criarAplicacaoDeTeste();
let org: Awaited<ReturnType<typeof comoOrganizador>>;

const daquiA = (diasAFrente: number) => somarDias(hoje(), diasAFrente);
const NOVA = {
  data: daquiA(30),
  inicio: '19:00',
  fim: '21:00',
  vagas: 5,
  tarefas: [{ nome: 'Varrer o salão' }, { nome: '' }, { nome: '  Tirar o lixo  ' }],
};

beforeEach(async () => {
  await limparBanco();
  org = await comoOrganizador(aplicacao);
});

describe('Listar (S13) e ver uma limpeza', () => {
  it('mesmas limpezas da escala pública, com telefone formatado e observação', async () => {
    await criarDiaPassado();
    const dia = await criarDia({ data: daquiA(2) });
    await criarConfirmacao(dia, { nome: 'Ana Souza', telefone: '47999991234', observacao: 'levo o rodo' });

    const resposta = await org.get('/api/organizador/dias');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(1);
    expect(resposta.body[0].pessoas[0]).toMatchObject({
      nome: 'Ana Souza',
      telefone: '47 99999-1234',
      observacao: 'levo o rodo',
      tempo: 'todo',
    });
    expect(new Date(resposta.body[0].pessoas[0].criadoEm).toString()).not.toBe('Invalid Date');
  });

  it('uma limpeza pelo id; 404 se não existe', async () => {
    const dia = await criarDia();
    expect((await org.get(`/api/organizador/dias/${dia.id}`)).body.id).toBe(dia.id);
    expect((await org.get(`/api/organizador/dias/${ID_QUE_NAO_EXISTE}`)).status).toBe(404);
  });
});

describe('Sugestão de tarefas (S7)', () => {
  it('nomes das tarefas da limpeza mais recente, em ordem', async () => {
    const antiga = await criarDia({ data: daquiA(3) });
    await criarTarefa(antiga, { nome: 'Antiga', ordem: 0 });
    const recente = await criarDia({ data: daquiA(10) });
    await criarTarefa(recente, { nome: 'Segunda', ordem: 1 });
    await criarTarefa(recente, { nome: 'Primeira', ordem: 0 });

    expect((await org.get('/api/organizador/sugestao-tarefas')).body).toEqual(['Primeira', 'Segunda']);
  });

  it('vale mesmo quando a mais recente já passou; lista vazia sem limpezas', async () => {
    expect((await org.get('/api/organizador/sugestao-tarefas')).body).toEqual([]);
    const passada = await criarDiaPassado();
    await criarTarefa(passada, { nome: 'Varrer' });
    expect((await org.get('/api/organizador/sugestao-tarefas')).body).toEqual(['Varrer']);
  });
});

describe('Criar limpeza (S1–S5)', () => {
  it('válida → 201; tarefa vazia ignorada e nomes aparados', async () => {
    const resposta = await org.post('/api/organizador/dias', NOVA);
    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({ data: NOVA.data, inicio: '19:00', fim: '21:00', vagas: 5, pessoas: [] });
    expect(resposta.body.tarefas.map((t: { nome: string }) => t.nome)).toEqual(['Varrer o salão', 'Tirar o lixo']);
  });

  it('S6: qualquer dia da semana é aceito (quinta e segunda)', async () => {
    const quinta = proximoDiaDaSemana(daquiA(40), 'Quinta');
    const segunda = proximoDiaDaSemana(daquiA(40), 'Segunda');
    expect((await org.post('/api/organizador/dias', { ...NOVA, data: quinta })).status).toBe(201);
    expect((await org.post('/api/organizador/dias', { ...NOVA, data: segunda })).status).toBe(201);
  });

  it('data passada → 409 LIMPEZA_PASSADA (S1); hoje é aceito', async () => {
    expect((await org.post('/api/organizador/dias', { ...NOVA, data: daquiA(-1) })).body.codigo).toBe('LIMPEZA_PASSADA');
    expect((await org.post('/api/organizador/dias', { ...NOVA, data: hoje() })).status).toBe(201);
  });

  it('data repetida → 409 DATA_REPETIDA (S2)', async () => {
    await criarDia({ data: NOVA.data });
    const resposta = await org.post('/api/organizador/dias', NOVA);
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ codigo: 'DATA_REPETIDA', mensagem: 'Já existe uma limpeza cadastrada nessa data.' });
  });

  it('fim antes do início → 400 (S3)', async () => {
    const resposta = await org.post('/api/organizador/dias', { ...NOVA, inicio: '21:00', fim: '19:00' });
    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ fim: MENSAGENS.fimAntesDoInicio });
  });

  it('vagas 0 ou 31 → 400 (S4)', async () => {
    for (const vagas of [0, 31]) {
      const resposta = await org.post('/api/organizador/dias', { ...NOVA, vagas });
      expect(resposta.status, String(vagas)).toBe(400);
      expect(resposta.body.campos, String(vagas)).toEqual({ vagas: MENSAGENS.vagasInvalidas });
    }
  });

  it('tarefa repetida → 400 (S5)', async () => {
    const resposta = await org.post('/api/organizador/dias', { ...NOVA, tarefas: [{ nome: 'Varrer' }, { nome: 'Varrer' }] });
    expect(resposta.status).toBe(400);
    expect(resposta.body.campos.tarefas).toBe(MENSAGENS.tarefaRepetida('Varrer'));
  });
});

describe('Editar limpeza (S8, S9, S10)', () => {
  it('S9: renomear uma tarefa mantém "feita"; nova entra; a que não veio sai; a ordem segue a lista', async () => {
    const dia = await criarDia();
    const varrer = await criarTarefa(dia, { nome: 'Varrer', ordem: 0, feita: true });
    const lixo = await criarTarefa(dia, { nome: 'Lixo', ordem: 1 });
    await criarTarefa(dia, { nome: 'Vai sair', ordem: 2 });

    const resposta = await org.put(`/api/organizador/dias/${dia.id}`, {
      ...NOVA,
      data: dia.data,
      tarefas: [{ id: lixo.id, nome: 'Varrer' }, { id: varrer.id, nome: 'Varrer o salão' }, { nome: 'Nova' }],
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.tarefas).toEqual([
      { id: lixo.id, nome: 'Varrer', feita: false },
      { id: varrer.id, nome: 'Varrer o salão', feita: true },
      { id: expect.any(String), nome: 'Nova', feita: false },
    ]);
  });

  it('S8: vagas abaixo dos confirmados → 409 com "confirmados"', async () => {
    const dia = await criarDia({ vagas: 5 });
    for (let i = 0; i < 4; i++) await criarConfirmacao(dia);

    const resposta = await org.put(`/api/organizador/dias/${dia.id}`, { ...NOVA, data: dia.data, vagas: 3 });
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      codigo: 'VAGAS_MENOR_QUE_CONFIRMADOS',
      mensagem: mensagemDoErro('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados: 4 }),
      confirmados: 4,
    });
    expect((await org.put(`/api/organizador/dias/${dia.id}`, { ...NOVA, data: dia.data, vagas: 4 })).status).toBe(200);
  });

  it('S10: editar limpeza passada → 409 LIMPEZA_PASSADA', async () => {
    const dia = await criarDiaPassado();
    const resposta = await org.put(`/api/organizador/dias/${dia.id}`, NOVA);
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('LIMPEZA_PASSADA');
  });

  it('não pode mudar para uma data passada nem para a data de outra limpeza', async () => {
    const dia = await criarDia();
    const outra = await criarDia();
    expect((await org.put(`/api/organizador/dias/${dia.id}`, { ...NOVA, data: daquiA(-1) })).body.codigo).toBe(
      'LIMPEZA_PASSADA',
    );
    expect((await org.put(`/api/organizador/dias/${dia.id}`, { ...NOVA, data: outra.data })).body.codigo).toBe(
      'DATA_REPETIDA',
    );
  });

  it('tarefa com id de outra limpeza → 404, sem mudar nada', async () => {
    const dia = await criarDia({ vagas: 5 });
    const deOutra = await criarTarefa(await criarDia());
    const resposta = await org.put(`/api/organizador/dias/${dia.id}`, {
      ...NOVA,
      data: dia.data,
      vagas: 9,
      tarefas: [{ id: deOutra.id, nome: 'Roubada' }],
    });
    expect(resposta.status).toBe(404);
    const [semMudanca] = await bd.select().from(dias).where(eq(dias.id, dia.id));
    expect(semMudanca?.vagas).toBe(5);
  });

  it('limpeza que não existe → 404', async () => {
    expect((await org.put(`/api/organizador/dias/${ID_QUE_NAO_EXISTE}`, NOVA)).status).toBe(404);
  });
});

describe('Apagar limpeza (S11)', () => {
  it('some a limpeza, as confirmações e as tarefas', async () => {
    const dia = await criarDia();
    await criarConfirmacao(dia);
    await criarTarefa(dia);

    expect((await org.delete(`/api/organizador/dias/${dia.id}`)).status).toBe(204);
    expect(await bd.select().from(dias).where(eq(dias.id, dia.id))).toEqual([]);
    expect(await bd.select().from(confirmacoes).where(eq(confirmacoes.diaId, dia.id))).toEqual([]);
    expect(await bd.select().from(tarefas).where(eq(tarefas.diaId, dia.id))).toEqual([]);
    expect((await org.delete(`/api/organizador/dias/${dia.id}`)).status).toBe(404);
  });

  it('limpeza passada também pode ser apagada', async () => {
    const dia = await criarDiaPassado();
    expect((await org.delete(`/api/organizador/dias/${dia.id}`)).status).toBe(204);
  });
});

describe('Remover pessoa e desfazer (O5)', () => {
  it('remover → 200 com os dados; desfazer → 201 com a pessoa de volta', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia, {
      nome: 'Ana Souza', telefone: '47999991234', tempo: 'primeira-hora', observacao: 'levo o rodo',
    });

    const removida = await org.delete(`/api/organizador/dias/${dia.id}/pessoas/${pessoa.id}`);
    expect(removida.status).toBe(200);
    expect(removida.body).toMatchObject({
      id: pessoa.id, nome: 'Ana Souza', telefone: '47 99999-1234', tempo: 'primeira-hora', observacao: 'levo o rodo',
    });
    expect(await bd.select().from(confirmacoes).where(eq(confirmacoes.id, pessoa.id))).toEqual([]);

    const devolvida = await org.post(`/api/organizador/dias/${dia.id}/pessoas`, removida.body);
    expect(devolvida.status).toBe(201);
    expect(devolvida.body).toMatchObject({ nome: 'Ana Souza', telefone: '47 99999-1234', observacao: 'levo o rodo' });
  });

  it('o código de cancelamento antigo deixa de valer depois do desfazer (X6)', async () => {
    const dia = await criarDia();
    const pessoa = await criarConfirmacao(dia);
    const removida = await org.delete(`/api/organizador/dias/${dia.id}/pessoas/${pessoa.id}`);
    await org.post(`/api/organizador/dias/${dia.id}/pessoas`, removida.body);

    const cancelar = await org.post('/api/confirmacoes/cancelar', { codigoCancelamento: pessoa.codigo });
    expect(cancelar.body.codigo).toBe('CODIGO_INVALIDO');
  });

  it('desfazer sem vaga → 409 SEM_VAGA (a vaga foi ocupada nesse meio-tempo)', async () => {
    const dia = await criarDia({ vagas: 1 });
    const pessoa = await criarConfirmacao(dia);
    const removida = await org.delete(`/api/organizador/dias/${dia.id}/pessoas/${pessoa.id}`);
    await criarConfirmacao(dia);

    const resposta = await org.post(`/api/organizador/dias/${dia.id}/pessoas`, removida.body);
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('SEM_VAGA');
  });

  it('pessoa que não existe ou de outra limpeza → 404 PESSOA_NAO_ENCONTRADA', async () => {
    const dia = await criarDia();
    const deOutra = await criarConfirmacao(await criarDia());
    const resposta = await org.delete(`/api/organizador/dias/${dia.id}/pessoas/${deOutra.id}`);
    expect(resposta.status).toBe(404);
    expect(resposta.body.codigo).toBe('PESSOA_NAO_ENCONTRADA');
  });
});

describe('Cabeçalho da folha (L10, L11)', () => {
  const CABECALHO = { casaDeOracao: '123', local: 'Taiti', setor: 'Sede / Escolinha', atividades: 'Limpeza', tipoDeServico: 'apoio' };

  it('criar e editar gravam o cabeçalho; o organizador vê; o PUT substitui o cabeçalho inteiro', async () => {
    const criada = await org.post('/api/organizador/dias', { ...NOVA, cabecalho: CABECALHO });
    expect(criada.body.cabecalho).toEqual(CABECALHO);
    const editada = await org.put(`/api/organizador/dias/${criada.body.id}`, { ...NOVA, cabecalho: { local: 'Centro' } });
    expect(editada.body.cabecalho).toEqual({ ...CABECALHO_VAZIO, local: 'Centro' });
  });

  it('o padrão começa vazio; "usarComoPadrao" grava o cabeçalho daquela limpeza como padrão', async () => {
    expect((await org.get('/api/organizador/cabecalho-padrao')).body).toEqual(CABECALHO_VAZIO);
    await org.post('/api/organizador/dias', { ...NOVA, cabecalho: CABECALHO, usarComoPadrao: true });
    expect((await org.get('/api/organizador/cabecalho-padrao')).body).toEqual(CABECALHO);
    await org.post('/api/organizador/dias', { ...NOVA, data: daquiA(31), cabecalho: { local: 'Outro' } });
    expect((await org.get('/api/organizador/cabecalho-padrao')).body).toEqual(CABECALHO);
  });

  it('editar com "usarComoPadrao" também troca o padrão', async () => {
    const criada = await org.post('/api/organizador/dias', NOVA);
    await org.put(`/api/organizador/dias/${criada.body.id}`, { ...NOVA, cabecalho: { local: 'Centro' }, usarComoPadrao: true });
    expect((await org.get('/api/organizador/cabecalho-padrao')).body).toEqual({ ...CABECALHO_VAZIO, local: 'Centro' });
  });

  it('tipo de serviço inválido → 400 com campos', async () => {
    const resposta = await org.post('/api/organizador/dias', { ...NOVA, cabecalho: { tipoDeServico: 'x' } });
    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ 'cabecalho.tipoDeServico': MENSAGENS.tipoDeServicoInvalido });
  });

  it('o padrão é só do organizador', async () => {
    expect((await request(aplicacao).get('/api/organizador/cabecalho-padrao')).status).toBe(401);
  });
});
