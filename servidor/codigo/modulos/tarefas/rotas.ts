import { Router, type Request } from 'express';
import { esquemaMarcarTarefa, esquemaParametrosTarefa, ROTAS } from '@limpeza/compartilhado';
import { validar } from '../../http/validar.js';
import * as servico from './servico.js';

export const rotasDeTarefas = Router();

rotasDeTarefas.patch(
  ROTAS.tarefa(':id', ':tarefaId'),
  validar({ parametros: esquemaParametrosTarefa, naoEncontrado: 'TAREFA_NAO_ENCONTRADA', corpo: esquemaMarcarTarefa }),
  async (requisicao: Request<{ id: string; tarefaId: string }, unknown, { feita: boolean }>, resposta) => {
    resposta.json(await servico.marcar(requisicao.params.id, requisicao.params.tarefaId, requisicao.body.feita));
  },
);
