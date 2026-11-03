import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  errosPorCampo, esquemaCancelarPorCodigo, esquemaConfirmacao, esquemaCorrecaoPresenca, esquemaDia, esquemaEncerrar,
  esquemaEntrada, esquemaPessoaNaPresenca, esquemaTelefone,
  esquemaEntrar, esquemaMarcarTarefa, esquemaParametrosDia, MENSAGENS,
} from '../codigo/esquemas.js';

/** Valida e devolve `campos` (como a API devolveria) ou falha o teste se a entrada passou. */
function campos(esquema: z.ZodType, entrada: unknown): Record<string, string> {
  const resultado = esquema.safeParse(entrada);
  if (resultado.success) throw new Error('A entrada deveria ter sido recusada.');
  return errosPorCampo(resultado.error);
}

const CONFIRMACAO = { nome: 'Pedro Lima', telefone: '47 99999-1234', tempo: 'todo', observacao: '' };
const DIA = {
  data: '2026-10-30', inicio: '19:00', fim: '21:00', vagas: 5,
  tarefas: [{ nome: 'Varrer o salão' }, { nome: 'Tirar o lixo' }],
};
const UUID = '6f1c1b0e-8a3e-4c1a-9b7d-2f4e5a6b7c8d';

describe('esquemaConfirmacao (C1, C2)', () => {
  it('aceita um exemplo válido: telefone só com números e observação vazia vira null', () => {
    expect(esquemaConfirmacao.parse(CONFIRMACAO)).toEqual({
      nome: 'Pedro Lima', telefone: '47999991234', tempo: 'todo', observacao: null,
    });
  });

  it('tempo padrão é "todo" e campos a mais são ignorados', () => {
    const { tempo, observacao, ...semTempo } = CONFIRMACAO;
    expect(esquemaConfirmacao.parse({ ...semTempo, extra: 'x' })).toEqual({
      nome: 'Pedro Lima', telefone: '47999991234', tempo: 'todo', observacao: null,
    });
  });

  it('tira os espaços das pontas do nome', () => {
    expect(esquemaConfirmacao.parse({ ...CONFIRMACAO, nome: '  Ana  ' }).nome).toBe('Ana');
  });

  it('nome vazio, curto ou longo', () => {
    expect(campos(esquemaConfirmacao, { ...CONFIRMACAO, nome: '' }).nome).toBe(MENSAGENS.nomeObrigatorio);
    expect(campos(esquemaConfirmacao, { ...CONFIRMACAO, nome: '  Al ' }).nome).toBe(MENSAGENS.nomeCurto);
    expect(campos(esquemaConfirmacao, { ...CONFIRMACAO, nome: 'a'.repeat(81) }).nome).toBe(MENSAGENS.nomeLongo);
  });

  it('telefone vazio ou sem DDD', () => {
    expect(campos(esquemaConfirmacao, { ...CONFIRMACAO, telefone: '' }).telefone).toBe(
      MENSAGENS.telefoneObrigatorio,
    );
    expect(campos(esquemaConfirmacao, { ...CONFIRMACAO, telefone: '99999-1234' }).telefone).toBe(
      'Digite o número com DDD, ex.: 47 99999-9999.',
    );
  });

  it('tempo inválido e observação longa', () => {
    expect(campos(esquemaConfirmacao, { ...CONFIRMACAO, tempo: 'meia-hora' }).tempo).toBe(MENSAGENS.tempoInvalido);
    expect(campos(esquemaConfirmacao, { ...CONFIRMACAO, observacao: 'a'.repeat(201) }).observacao).toBe(
      MENSAGENS.observacaoLonga,
    );
  });

  it('formulário vazio: um erro em cada campo obrigatório', () => {
    expect(Object.keys(campos(esquemaConfirmacao, {})).sort()).toEqual(['nome', 'telefone']);
  });
});

describe('esquemaDia (S3, S4, S5)', () => {
  it('aceita um exemplo válido', () => {
    expect(esquemaDia.parse(DIA)).toEqual(DIA);
  });

  it('data vazia ou que não existe', () => {
    expect(campos(esquemaDia, { ...DIA, data: '' }).data).toBe(MENSAGENS.dataObrigatoria);
    expect(campos(esquemaDia, { ...DIA, data: '2026-02-30' }).data).toBe(MENSAGENS.dataInvalida);
  });

  it('hora inválida', () => {
    expect(campos(esquemaDia, { ...DIA, inicio: '25:00' }).inicio).toBe(MENSAGENS.horaInvalida);
  });

  it('S3: fim antes ou igual ao início', () => {
    expect(campos(esquemaDia, { ...DIA, fim: '18:00' }).fim).toBe(MENSAGENS.fimAntesDoInicio);
    expect(campos(esquemaDia, { ...DIA, fim: '19:00' }).fim).toBe(MENSAGENS.fimAntesDoInicio);
  });

  it('S4: vagas 0, 31 ou quebrada', () => {
    for (const vagas of [0, 31, 2.5]) {
      expect(campos(esquemaDia, { ...DIA, vagas }).vagas, String(vagas)).toBe(MENSAGENS.vagasInvalidas);
    }
    expect(esquemaDia.parse({ ...DIA, vagas: 1 }).vagas).toBe(1);
    expect(esquemaDia.parse({ ...DIA, vagas: 30 }).vagas).toBe(30);
  });

  it('S5: linhas vazias são ignoradas e os nomes são aparados', () => {
    const resultado = esquemaDia.parse({ ...DIA, tarefas: [{ nome: '  Varrer ' }, { nome: '   ' }, { nome: '' }] });
    expect(resultado.tarefas).toEqual([{ nome: 'Varrer' }]);
  });

  it('S5: sem tarefas é permitido', () => {
    const { tarefas, ...semTarefas } = DIA;
    expect(esquemaDia.parse(semTarefas).tarefas).toEqual([]);
  });

  it('S5: tarefa repetida, longa ou demais', () => {
    expect(campos(esquemaDia, { ...DIA, tarefas: [{ nome: 'Varrer' }, { nome: ' Varrer' }] }).tarefas).toBe(
      MENSAGENS.tarefaRepetida('Varrer'),
    );
    expect(campos(esquemaDia, { ...DIA, tarefas: [{ nome: 'a'.repeat(81) }] })['tarefas.0.nome']).toBe(
      MENSAGENS.tarefaLonga,
    );
    const trintaEUma = Array.from({ length: 31 }, (_, i) => ({ nome: `Tarefa ${i}` }));
    expect(campos(esquemaDia, { ...DIA, tarefas: trintaEUma }).tarefas).toBe(MENSAGENS.tarefasDemais);
  });

  it('S9: tarefa que já existia vem com id', () => {
    const resultado = esquemaDia.parse({ ...DIA, tarefas: [{ id: UUID, nome: 'Varrer (renomeada)' }] });
    expect(resultado.tarefas).toEqual([{ id: UUID, nome: 'Varrer (renomeada)' }]);
    expect(Object.keys(campos(esquemaDia, { ...DIA, tarefas: [{ id: 'abc', nome: 'Varrer' }] }))).toEqual([
      'tarefas.0.id',
    ]);
  });
});

describe('outros esquemas', () => {
  it('cancelar pelo código (X1)', () => {
    expect(esquemaCancelarPorCodigo.parse({ codigoCancelamento: 'abc' })).toEqual({ codigoCancelamento: 'abc' });
    expect(campos(esquemaCancelarPorCodigo, {}).codigoCancelamento).toBe(MENSAGENS.codigoObrigatorio);
  });

  it('cancelar pelo telefone (X2)', () => {
    expect(esquemaTelefone.parse({ telefone: '(47) 99999-1234' })).toEqual({ telefone: '47999991234' });
    expect(campos(esquemaTelefone, { telefone: '123' }).telefone).toBe(MENSAGENS.telefoneInvalido);
  });

  it('marcar tarefa (T1)', () => {
    expect(esquemaMarcarTarefa.parse({ feita: true })).toEqual({ feita: true });
    expect(campos(esquemaMarcarTarefa, { feita: 'sim' }).feita).toBe(MENSAGENS.feitaInvalida);
  });

  it('entrar (O1): senha vazia é recusada; espaços não são apagados', () => {
    expect(campos(esquemaEntrar, { senha: '' }).senha).toBe(MENSAGENS.senhaObrigatoria);
    expect(esquemaEntrar.parse({ senha: ' a b ' })).toEqual({ senha: ' a b ' });
  });

  it('id do endereço precisa ser um uuid', () => {
    expect(esquemaParametrosDia.parse({ id: UUID })).toEqual({ id: UUID });
    expect(campos(esquemaParametrosDia, { id: '123' }).id).toBe(MENSAGENS.idInvalido);
  });
});

const ENTRADA = { telefone: '47 99999-1234', numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true };

describe('esquemaEntrada (L3, L4)', () => {
  it('aceita sem nome e mantém o zero da frente da adesão', () => {
    expect(esquemaEntrada.parse(ENTRADA)).toEqual({
      telefone: '47999991234', numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true,
    });
  });

  it('aceita com nome (quem não confirmou antes)', () => {
    expect(esquemaEntrada.parse({ ...ENTRADA, nome: '  Célia Gomes ' }).nome).toBe('Célia Gomes');
  });

  it('adesão e código: só números, de 1 a 6 dígitos', () => {
    expect(campos(esquemaEntrada, { ...ENTRADA, numeroAdesao: '' })).toEqual({ numeroAdesao: MENSAGENS.adesaoObrigatoria });
    expect(campos(esquemaEntrada, { ...ENTRADA, numeroAdesao: '08a' })).toEqual({ numeroAdesao: MENSAGENS.adesaoInvalida });
    expect(campos(esquemaEntrada, { ...ENTRADA, codigoFuncao: '1234567' })).toEqual({
      codigoFuncao: MENSAGENS.codigoFuncaoInvalido,
    });
  });

  it('EPI é obrigatório', () => {
    const { recebeuEpi, ...semEpi } = ENTRADA;
    expect(campos(esquemaEntrada, semEpi)).toEqual({ recebeuEpi: MENSAGENS.epiObrigatorio });
  });
});

describe('esquemaCorrecaoPresenca (L8)', () => {
  const CORRECAO = { numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true, entrada: '19:30', saida: '20:45' };

  it('aceita, com hora vazia virando null e desfazerAssinatura falso por padrão', () => {
    expect(esquemaCorrecaoPresenca.parse({ ...CORRECAO, saida: '' })).toEqual({
      ...CORRECAO, saida: null, desfazerAssinatura: false,
    });
  });

  it('saída no mesmo minuto da entrada vale; antes, não', () => {
    expect(esquemaCorrecaoPresenca.parse({ ...CORRECAO, saida: '19:30' }).saida).toBe('19:30');
    expect(campos(esquemaCorrecaoPresenca, { ...CORRECAO, saida: '19:00' })).toEqual({
      saida: MENSAGENS.saidaAntesDaEntrada,
    });
  });

  it('saída sem entrada não vale', () => {
    expect(campos(esquemaCorrecaoPresenca, { ...CORRECAO, entrada: '' })).toEqual({
      saida: MENSAGENS.saidaSemEntrada,
    });
  });

  it('não existe campo para criar assinatura: "assinado" é ignorado', () => {
    expect(esquemaCorrecaoPresenca.parse({ ...CORRECAO, assinado: true })).not.toHaveProperty('assinado');
  });

  it('adesão e código apagados viram null, como a hora', () => {
    const apagados = esquemaCorrecaoPresenca.parse({
      numeroAdesao: '', codigoFuncao: '', recebeuEpi: null, entrada: '', saida: '',
    });
    expect(apagados).toMatchObject({ numeroAdesao: null, codigoFuncao: null, entrada: null, saida: null });
  });
});

describe('esquemaPessoaNaPresenca (L14)', () => {
  const NOVA = { nome: 'Dona Maria', numeroAdesao: '12', codigoFuncao: '222', recebeuEpi: true, entrada: '19:30' };

  it('telefone opcional: vazio ou ausente vira null; com telefone, só os números', () => {
    expect(esquemaPessoaNaPresenca.parse(NOVA)).toMatchObject({ telefone: null, saida: null });
    expect(esquemaPessoaNaPresenca.parse({ ...NOVA, telefone: '' }).telefone).toBeNull();
    expect(esquemaPessoaNaPresenca.parse({ ...NOVA, telefone: '47 99999-1234' }).telefone).toBe('47999991234');
  });

  it('nome e entrada são obrigatórios; telefone, se vier, tem que ser válido', () => {
    expect(campos(esquemaPessoaNaPresenca, { ...NOVA, nome: '' })).toEqual({ nome: MENSAGENS.nomeObrigatorio });
    expect(campos(esquemaPessoaNaPresenca, { ...NOVA, entrada: '' })).toEqual({ entrada: MENSAGENS.horaObrigatoria });
    expect(campos(esquemaPessoaNaPresenca, { ...NOVA, telefone: '123' })).toEqual({
      telefone: MENSAGENS.telefoneInvalido,
    });
  });
});

describe('esquemaEncerrar (L13)', () => {
  it('sem hora (a hora de agora) ou com hora válida', () => {
    expect(esquemaEncerrar.parse({})).toEqual({});
    expect(esquemaEncerrar.parse({ saida: '20:45' })).toEqual({ saida: '20:45' });
    expect(campos(esquemaEncerrar, { saida: '25:00' })).toEqual({ saida: MENSAGENS.horaInvalida });
  });
});
