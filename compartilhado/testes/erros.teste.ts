import { describe, expect, it } from 'vitest';
import { CATALOGO_DE_ERROS, ehCodigoDeErro, mensagemDoErro, statusDoErro } from '../codigo/erros.js';

/** Todos os códigos citados em docs/04-api.md, com o status esperado. */
const CODIGOS_DA_API = {
  DADOS_INVALIDOS: 400,
  SESSAO_EXPIRADA: 401,
  SENHA_INCORRETA: 401,
  DIA_NAO_ENCONTRADO: 404,
  TAREFA_NAO_ENCONTRADA: 404,
  CODIGO_INVALIDO: 404,
  TELEFONE_NAO_CONFERE: 404,
  SEXTA_PASSADA: 409,
  SEM_VAGA: 409,
  TELEFONE_REPETIDO: 409,
  DATA_REPETIDA: 409,
  VAGAS_MENOR_QUE_CONFIRMADOS: 409,
  MUITAS_TENTATIVAS: 429,
  ERRO_INTERNO: 500,
} as const;

describe('catálogo de erros', () => {
  it('todo código usado pela API existe, com o status certo', () => {
    for (const [codigo, status] of Object.entries(CODIGOS_DA_API)) {
      expect(ehCodigoDeErro(codigo), codigo).toBe(true);
      expect(statusDoErro(codigo as keyof typeof CODIGOS_DA_API), codigo).toBe(status);
    }
  });

  it('todo código tem uma mensagem em português, sem detalhe técnico', () => {
    for (const codigo of Object.keys(CATALOGO_DE_ERROS)) {
      const mensagem = mensagemDoErro(codigo as keyof typeof CATALOGO_DE_ERROS, { confirmados: 2 });
      expect(mensagem.length, codigo).toBeGreaterThan(10);
      expect(mensagem, codigo).not.toMatch(/error|exception|stack|sql/i);
    }
  });

  it('usa as mensagens escritas nas regras', () => {
    expect(mensagemDoErro('SEM_VAGA')).toBe('As vagas desta sexta acabaram.');
    expect(mensagemDoErro('TELEFONE_REPETIDO')).toBe('Esse telefone já está confirmado nesta sexta.');
    expect(mensagemDoErro('TELEFONE_NAO_CONFERE')).toBe(
      'Esse telefone não confere com nenhuma confirmação desta sexta.',
    );
    expect(mensagemDoErro('SENHA_INCORRETA')).toBe(
      'Senha incorreta. Peça a senha para quem administra o app.',
    );
    expect(mensagemDoErro('SESSAO_EXPIRADA')).toBe('Entre de novo na área de quem organiza.');
    expect(mensagemDoErro('DATA_REPETIDA')).toBe('Já existe uma sexta cadastrada nessa data.');
    expect(mensagemDoErro('ERRO_INTERNO')).toBe('Algo deu errado. Tente de novo em instantes.');
  });

  it('S8: a mensagem diz quantos já confirmaram', () => {
    expect(mensagemDoErro('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados: 4 })).toContain('4 pessoas');
    expect(mensagemDoErro('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados: 1 })).toContain('1 pessoa confirmou');
  });

  it('recusa código que não existe', () => {
    expect(ehCodigoDeErro('NAO_EXISTE')).toBe(false);
    expect(ehCodigoDeErro('toString')).toBe(false);
  });
});
