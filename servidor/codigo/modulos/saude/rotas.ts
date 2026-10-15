import { Router } from 'express';
import { ROTAS } from '@limpeza/compartilhado';

/** GET /api/saude: confere se o servidor está no ar. Não acessa dados pessoais. */
export const rotasDeSaude = Router();

rotasDeSaude.get(ROTAS.saude, (_requisicao, resposta) => {
  resposta.json({ ok: true });
});
