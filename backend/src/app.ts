/**
 * criarApp(): monta o Express. Usado pelo servidor (servidor.ts) E pelos testes.
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { PREFIXO_API } from '@limpeza/shared';
import { config } from './config.js';
import { limitarEscritas } from './http/limitar-escritas.js';
import { criarLog, registrarRequisicoes, type Log } from './http/log.js';
import { rotaNaoEncontrada, tratarErros } from './http/tratar-erros.js';
import { rotasDeConfirmacoes } from './modulos/confirmacoes/rotas.js';
import { rotasDeDias } from './modulos/dias/rotas.js';
import { rotasDoOrganizador } from './modulos/organizador/rotas.js';
import { rotasDeSaude } from './modulos/saude/rotas.js';
import { rotasDeTarefas } from './modulos/tarefas/rotas.js';

/** Tamanho máximo do corpo das requisições (docs/04-api.md). */
const CORPO_MAXIMO = '10kb';

export interface OpcoesDoApp {
  /** Log a usar; os testes passam um silencioso ou um que captura as linhas. */
  log?: Log;
  /** Escritas por minuto por IP; os testes podem aumentar para não esbarrar no limite. */
  escritasPorMinuto?: number;
}

export function criarApp(opcoes: OpcoesDoApp = {}) {
  const log = opcoes.log ?? criarLog();
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.ORIGEM_FRONTEND }));
  app.use(registrarRequisicoes(log));
  app.use(express.json({ limit: CORPO_MAXIMO }));
  app.use(limitarEscritas(opcoes.escritasPorMinuto));

  const api = express.Router();
  api.use(rotasDeSaude, rotasDeDias, rotasDeConfirmacoes, rotasDeTarefas, rotasDoOrganizador);
  app.use(PREFIXO_API, api);

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);
  return app;
}
