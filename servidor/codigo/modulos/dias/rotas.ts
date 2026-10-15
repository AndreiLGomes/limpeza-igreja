import { Router, type Request } from 'express';
import { esquemaParametrosDia, ROTAS } from '@limpeza/compartilhado';
import { validar } from '../../http/validar.js';
import * as servico from './servico.js';

export const rotasDeDias = Router();

rotasDeDias.get(ROTAS.dias, async (_requisicao, resposta) => {
  resposta.json(await servico.escalaPublica());
});

rotasDeDias.get(
  ROTAS.dia(':id'),
  validar({ parametros: esquemaParametrosDia, naoEncontrado: 'DIA_NAO_ENCONTRADO' }),
  async (requisicao: Request<{ id: string }>, resposta) => {
    resposta.json(await servico.diaPublico(requisicao.params.id));
  },
);
