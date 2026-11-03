/** Endereços públicos da presença (L1–L7, L12). Sem senha; o limite geral de escritas vale aqui também. */
import { Router, type Request } from 'express';
import { esquemaEntrada, esquemaTelefone, ROTAS, type DadosEntrada } from '@limpeza/compartilhado';
import { DIA_VALIDO, validar } from '../../http/validar.js';
import * as servico from './servico.js';

export const rotasDePresenca = Router();

type ComTelefone = Request<{ id: string }, unknown, { telefone: string }>;

rotasDePresenca.post(
  ROTAS.presenca.consultar(':id'),
  validar({ ...DIA_VALIDO, corpo: esquemaTelefone }),
  async (requisicao: ComTelefone, resposta) => {
    resposta.json(await servico.consultar(requisicao.params.id, requisicao.body.telefone));
  },
);

rotasDePresenca.post(
  ROTAS.presenca.entrada(':id'),
  validar({ ...DIA_VALIDO, corpo: esquemaEntrada }),
  async (requisicao: Request<{ id: string }, unknown, DadosEntrada>, resposta) => {
    resposta.json(await servico.marcarEntrada(requisicao.params.id, requisicao.body));
  },
);

rotasDePresenca.post(
  ROTAS.presenca.saida(':id'),
  validar({ ...DIA_VALIDO, corpo: esquemaTelefone }),
  async (requisicao: ComTelefone, resposta) => {
    resposta.json(await servico.marcarSaida(requisicao.params.id, requisicao.body.telefone));
  },
);
