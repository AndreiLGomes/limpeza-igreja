/**
 * Limite geral (docs/04-api.md): no máximo 60 escritas (POST, PUT, PATCH, DELETE) por minuto por IP.
 * As tentativas erradas de senha (O3) e de cancelamento (X3) usam outra peça: limitar-tentativas.ts.
 */
import type { Request } from 'express';
import { rateLimit, type RateLimitInfo } from 'express-rate-limit';
import { ESCRITAS_POR_MINUTO } from '@limpeza/shared';
import { ErroApp } from '../comum/erros.js';

const UM_MINUTO = 60_000;
const LEITURAS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function limitarEscritas(limite = ESCRITAS_POR_MINUTO) {
  return rateLimit({
    windowMs: UM_MINUTO,
    limit: limite,
    skip: (req) => LEITURAS.has(req.method),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, _res, next) => {
      // O express-rate-limit põe as informações em req.rateLimit, mas não declara o tipo no Express.
      const info = (req as Request & { rateLimit?: RateLimitInfo }).rateLimit;
      const fimDaJanela = info?.resetTime?.getTime() ?? Date.now() + UM_MINUTO;
      const tentarEmSegundos = Math.max(1, Math.ceil((fimDaJanela - Date.now()) / 1000));
      next(new ErroApp('MUITAS_TENTATIVAS', { tentarEmSegundos }));
    },
  });
}
