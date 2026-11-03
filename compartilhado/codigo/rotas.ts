/**
 * Os endereços da API num lugar só (docs/04-api.md), relativos a PREFIXO_API.
 * O site monta as URLs com eles; o servidor registra as rotas passando os nomes dos parâmetros,
 * ex.: ROTAS.dia(':id') → "/dias/:id".
 */

export const PREFIXO_API = '/api';

export const ROTAS = {
  saude: '/saude',
  dias: '/dias',
  dia: (id: string) => `/dias/${id}`,
  confirmar: (diaId: string) => `/dias/${diaId}/confirmacoes`,
  cancelarPorCodigo: '/confirmacoes/cancelar',
  cancelarPorTelefone: (diaId: string) => `/dias/${diaId}/confirmacoes/cancelar-por-telefone`,
  tarefa: (diaId: string, tarefaId: string) => `/dias/${diaId}/tarefas/${tarefaId}`,
  presenca: {
    consultar: (diaId: string) => `/dias/${diaId}/presenca/consultar`,
    entrada: (diaId: string) => `/dias/${diaId}/presenca/entrada`,
    saida: (diaId: string) => `/dias/${diaId}/presenca/saida`,
  },
  organizador: {
    entrar: '/organizador/entrar',
    sair: '/organizador/sair',
    dias: '/organizador/dias',
    dia: (id: string) => `/organizador/dias/${id}`,
    sugestaoTarefas: '/organizador/sugestao-tarefas',
    cabecalhoPadrao: '/organizador/cabecalho-padrao',
    pessoas: (diaId: string) => `/organizador/dias/${diaId}/pessoas`,
    pessoa: (diaId: string, pessoaId: string) => `/organizador/dias/${diaId}/pessoas/${pessoaId}`,
    presenca: (diaId: string, pessoaId: string) => `/organizador/dias/${diaId}/pessoas/${pessoaId}/presenca`,
    presencaNova: (diaId: string) => `/organizador/dias/${diaId}/presenca`,
    encerrar: (diaId: string) => `/organizador/dias/${diaId}/encerrar`,
  },
} as const;
