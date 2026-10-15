import { Router, type Request } from 'express';
import { esquemaParamsDia, ROTAS } from '@limpeza/shared';
import { validar } from '../../http/validar.js';
import * as servico from './servico.js';

export const rotasDeDias = Router();

rotasDeDias.get(ROTAS.dias, async (_req, res) => {
  res.json(await servico.escalaPublica());
});

rotasDeDias.get(
  ROTAS.dia(':id'),
  validar({ params: esquemaParamsDia, naoEncontrado: 'DIA_NAO_ENCONTRADO' }),
  async (req: Request<{ id: string }>, res) => {
    res.json(await servico.diaPublico(req.params.id));
  },
);
