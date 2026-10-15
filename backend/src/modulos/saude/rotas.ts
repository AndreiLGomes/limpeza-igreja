import { Router } from 'express';
import { ROTAS } from '@limpeza/shared';

/** GET /api/saude: confere se o servidor está no ar. Não acessa dados pessoais. */
export const rotasDeSaude = Router();

rotasDeSaude.get(ROTAS.saude, (_req, res) => {
  res.json({ ok: true });
});
