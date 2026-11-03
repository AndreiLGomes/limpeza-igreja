import { Router, type Request } from 'express';
import { ROTAS } from '@limpeza/compartilhado';
import { DIA_VALIDO, validar } from '../../http/validar.js';
import * as servico from './servico.js';

export const rotasDeDias = Router();

rotasDeDias.get(ROTAS.dias, async (_requisicao, resposta) => {
  resposta.json(await servico.escalaPublica());
});

rotasDeDias.get(
  ROTAS.dia(':id'),
  validar(DIA_VALIDO),
  async (requisicao: Request<{ id: string }>, resposta) => {
    resposta.json(await servico.diaPublico(requisicao.params.id));
  },
);
