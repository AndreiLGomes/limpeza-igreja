/**
 * criarAplicacao(): monta o Express. Usado pelo servidor (servidor.ts) E pelos testes.
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { PREFIXO_API } from '@limpeza/compartilhado';
import { configuracao } from './configuracao.js';
import { limitarEscritas } from './http/limitar-escritas.js';
import { criarRegistro, registrarRequisicoes, type Registro } from './http/registro.js';
import { rotaNaoEncontrada, tratarErros } from './http/tratar-erros.js';
import { rotasDeConfirmacoes } from './modulos/confirmacoes/rotas.js';
import { rotasDeDias } from './modulos/dias/rotas.js';
import { rotasDoOrganizador } from './modulos/organizador/rotas.js';
import { rotasDeSaude } from './modulos/saude/rotas.js';
import { rotasDeTarefas } from './modulos/tarefas/rotas.js';

/** Tamanho máximo do corpo das requisições (docs/04-api.md). */
const CORPO_MAXIMO = '10kb';

export interface OpcoesDaAplicacao {
  /** Registro a usar; os testes passam um silencioso ou um que captura as linhas. */
  registro?: Registro;
  /** Escritas por minuto por IP; os testes podem aumentar para não esbarrar no limite. */
  escritasPorMinuto?: number;
}

export function criarAplicacao(opcoes: OpcoesDaAplicacao = {}) {
  const registro = opcoes.registro ?? criarRegistro();
  const aplicacao = express();

  aplicacao.use(helmet());
  aplicacao.use(cors({ origin: configuracao.ORIGEM_DO_SITE }));
  aplicacao.use(registrarRequisicoes(registro));
  aplicacao.use(express.json({ limit: CORPO_MAXIMO }));
  aplicacao.use(limitarEscritas(opcoes.escritasPorMinuto));

  const api = express.Router();
  api.use(rotasDeSaude, rotasDeDias, rotasDeConfirmacoes, rotasDeTarefas, rotasDoOrganizador);
  aplicacao.use(PREFIXO_API, api);

  aplicacao.use(rotaNaoEncontrada);
  aplicacao.use(tratarErros);
  return aplicacao;
}
