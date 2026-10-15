/**
 * exigirOrganizador: protege os endereços do organizador (O4).
 * Exige "Authorization: Bearer <token>" de uma sessão válida; senão 401 SESSAO_EXPIRADA.
 * O id da sessão fica em resposta.locals.sessaoId (usado pelo "sair").
 */
import type { RequestHandler } from 'express';
import { sessaoDoToken } from '../modulos/organizador/servico.js';

const PREFIXO = 'Bearer ';

export const exigirOrganizador: RequestHandler = async (requisicao, resposta, proximo) => {
  const cabecalho = requisicao.get('authorization');
  const token = cabecalho?.startsWith(PREFIXO) ? cabecalho.slice(PREFIXO.length).trim() : undefined;
  resposta.locals['sessaoId'] = await sessaoDoToken(token);
  proximo();
};
