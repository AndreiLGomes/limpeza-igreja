import { Router, type Request } from 'express';
import { esquemaMarcarTarefa, esquemaParamsTarefa, ROTAS } from '@limpeza/shared';
import { validar } from '../../http/validar.js';
import * as servico from './servico.js';

export const rotasDeTarefas = Router();

rotasDeTarefas.patch(
  ROTAS.tarefa(':id', ':tarefaId'),
  validar({ params: esquemaParamsTarefa, naoEncontrado: 'TAREFA_NAO_ENCONTRADA', body: esquemaMarcarTarefa }),
  async (req: Request<{ id: string; tarefaId: string }, unknown, { feita: boolean }>, res) => {
    res.json(await servico.marcar(req.params.id, req.params.tarefaId, req.body.feita));
  },
);
