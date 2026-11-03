/**
 * Etapa 3: as restrições estão NO BANCO (docs/03-banco-de-dados.md).
 * Aqui os dados são inseridos "à mão", com SQL puro, de propósito: mesmo sem passar pelo código,
 * o banco precisa recusar o que é inválido.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { conexoes } from '../codigo/banco/cliente.js';
import { limparBanco } from './ajuda/banco.js';
import { criarConfirmacao, criarDia, criarTarefa } from './ajuda/fabricas.js';

/** Códigos de erro do PostgreSQL. */
const VIOLA_CHECK = '23514';
const VIOLA_UNIQUE = '23505';

async function esperarRecusa(consulta: Promise<unknown>, codigo: string, restricao: string) {
  await expect(consulta).rejects.toMatchObject({ code: codigo, constraint: restricao });
}

function inserirDia(data: string, inicio: string, fim: string, vagas: number) {
  return conexoes.query('INSERT INTO dias (data, inicio, fim, vagas) VALUES ($1, $2, $3, $4)', [data, inicio, fim, vagas]);
}

function inserirConfirmacao(diaId: string, nome: string, telefone: string, tempo = 'todo') {
  return conexoes.query(
    `INSERT INTO confirmacoes (dia_id, nome, telefone, tempo, codigo_cancelamento_hash)
     VALUES ($1, $2, $3, $4, md5(random()::text))`,
    [diaId, nome, telefone, tempo],
  );
}

beforeEach(limparBanco);

describe('tabela dias', () => {
  it('gera id e criado_em sozinha', async () => {
    const dia = await criarDia();
    expect(dia.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dia.criadoEm).toBeInstanceOf(Date);
  });

  it('S4: recusa vagas = 0 e vagas = 31', async () => {
    await esperarRecusa(inserirDia('2030-01-04', '19:00', '21:00', 0), VIOLA_CHECK, 'dias_vagas_validas');
    await esperarRecusa(inserirDia('2030-01-04', '19:00', '21:00', 31), VIOLA_CHECK, 'dias_vagas_validas');
  });

  it('S3: recusa fim antes ou igual ao início', async () => {
    await esperarRecusa(inserirDia('2030-01-04', '21:00', '19:00', 5), VIOLA_CHECK, 'dias_fim_depois_do_inicio');
    await esperarRecusa(inserirDia('2030-01-04', '19:00', '19:00', 5), VIOLA_CHECK, 'dias_fim_depois_do_inicio');
  });

  it('S2: recusa duas limpezas na mesma data', async () => {
    await inserirDia('2030-01-04', '19:00', '21:00', 5);
    await esperarRecusa(inserirDia('2030-01-04', '08:00', '10:00', 3), VIOLA_UNIQUE, 'dias_data_unica');
  });
});

describe('tabela confirmacoes', () => {
  it('C2: recusa telefone com 9 dígitos ou com letra; aceita 10 dígitos', async () => {
    const dia = await criarDia();
    for (const telefone of ['479999912', '4799999123a']) {
      await esperarRecusa(
        inserirConfirmacao(dia.id, 'Pedro Lima', telefone),
        VIOLA_CHECK,
        'confirmacoes_telefone_so_digitos',
      );
    }
    await expect(inserirConfirmacao(dia.id, 'Pedro Lima', '4799999123')).resolves.toBeDefined();
  });

  it('C1: recusa nome com menos de 3 letras', async () => {
    const dia = await criarDia();
    await esperarRecusa(inserirConfirmacao(dia.id, 'Al', '47999991234'), VIOLA_CHECK, 'confirmacoes_nome_tamanho');
  });

  it('recusa tempo que não existe', async () => {
    const dia = await criarDia();
    await esperarRecusa(
      inserirConfirmacao(dia.id, 'Pedro Lima', '47999991234', 'meia-hora'),
      VIOLA_CHECK,
      'confirmacoes_tempo_valido',
    );
  });

  it('C4: o mesmo telefone não confirma duas vezes na mesma limpeza, mas pode em outra', async () => {
    const dia = await criarDia();
    const outroDia = await criarDia();
    await criarConfirmacao(dia, { telefone: '47999991234' });
    await esperarRecusa(
      inserirConfirmacao(dia.id, 'Outra Pessoa', '47999991234'),
      VIOLA_UNIQUE,
      'confirmacoes_telefone_unico_no_dia',
    );
    await expect(inserirConfirmacao(outroDia.id, 'Outra Pessoa', '47999991234')).resolves.toBeDefined();
  });
});

describe('tabela tarefas', () => {
  it('S5: recusa nome repetido na mesma limpeza e nome vazio', async () => {
    const dia = await criarDia();
    await criarTarefa(dia, { nome: 'Varrer o salão' });
    await esperarRecusa(
      conexoes.query(`INSERT INTO tarefas (dia_id, nome, ordem) VALUES ($1, 'Varrer o salão', 9)`, [dia.id]),
      VIOLA_UNIQUE,
      'tarefas_nome_unico_no_dia',
    );
    await esperarRecusa(
      conexoes.query(`INSERT INTO tarefas (dia_id, nome, ordem) VALUES ($1, '', 9)`, [dia.id]),
      VIOLA_CHECK,
      'tarefas_nome_tamanho',
    );
  });

  it('começa como não feita', async () => {
    const tarefa = await criarTarefa(await criarDia());
    expect(tarefa.feita).toBe(false);
    expect(tarefa.feitaEm).toBeNull();
  });
});

describe('S11: apagar uma limpeza apaga junto as confirmações e as tarefas', () => {
  it('ON DELETE CASCADE', async () => {
    const dia = await criarDia();
    await criarConfirmacao(dia);
    await criarTarefa(dia);
    await conexoes.query('DELETE FROM dias WHERE id = $1', [dia.id]);

    const sobrou = await conexoes.query(
      `SELECT (SELECT count(*) FROM confirmacoes)::int AS confirmacoes, (SELECT count(*) FROM tarefas)::int AS tarefas`,
    );
    expect(sobrou.rows[0]).toEqual({ confirmacoes: 0, tarefas: 0 });
  });
});

describe('tabela tentativas_acesso', () => {
  it('só aceita os tipos "senha" e "cancelamento"', async () => {
    await expect(
      conexoes.query(`INSERT INTO tentativas_acesso (tipo, chave) VALUES ('senha', 'hash-do-ip')`),
    ).resolves.toBeDefined();
    await esperarRecusa(
      conexoes.query(`INSERT INTO tentativas_acesso (tipo, chave) VALUES ('outro', 'hash-do-ip')`),
      VIOLA_CHECK,
      'tentativas_tipo_valido',
    );
  });
});

describe('Presença: restrições no banco (L4, L6, L14)', () => {
  /** As fábricas passam pelo Drizzle, que embrulha o erro do PostgreSQL em `cause`. */
  const esperarRecusaDaFabrica = (consulta: Promise<unknown>, restricao: string) =>
    expect(consulta).rejects.toMatchObject({ cause: { code: VIOLA_CHECK, constraint: restricao } });

  it('adesão e código só com números', async () => {
    const dia = await criarDia();
    await esperarRecusaDaFabrica(criarConfirmacao(dia, { numeroAdesao: '08a' }), 'confirmacoes_adesao_so_digitos');
    await esperarRecusaDaFabrica(criarConfirmacao(dia, { codigoFuncao: '22a' }), 'confirmacoes_codigo_funcao_so_digitos');
  });

  it('saída exige entrada e não pode ser antes dela; assinatura exige entrada (é feita na chegada)', async () => {
    const dia = await criarDia();
    await esperarRecusaDaFabrica(criarConfirmacao(dia, { saida: '20:00' }), 'confirmacoes_saida_depois_da_entrada');
    await esperarRecusaDaFabrica(
      criarConfirmacao(dia, { entrada: '20:00', saida: '19:00' }),
      'confirmacoes_saida_depois_da_entrada',
    );
    await esperarRecusaDaFabrica(criarConfirmacao(dia, { assinadoEm: new Date() }), 'confirmacoes_assinatura_com_entrada');
    const chegou = await criarConfirmacao(dia, { entrada: '20:00', assinadoEm: new Date() });
    expect(chegou.saida).toBeNull();
    const saiu = await criarConfirmacao(dia, { entrada: '20:00', saida: '20:00', assinadoEm: new Date() });
    expect(saiu.saida).toBe('20:00:00');
  });

  it('L14: o telefone pode ficar vazio, e duas pessoas sem telefone cabem na mesma limpeza', async () => {
    const dia = await criarDia();
    await criarConfirmacao(dia, { telefone: null });
    const segunda = await criarConfirmacao(dia, { telefone: null });
    expect(segunda.telefone).toBeNull();
  });
});
