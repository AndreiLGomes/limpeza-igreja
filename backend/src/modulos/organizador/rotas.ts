/**
 * Endereços do organizador (docs/04-api.md). Todos exigem a sessão (exigirOrganizador), menos "entrar".
 */
import { Router, type Request, type Response } from 'express';
import {
  esquemaConfirmacao, esquemaDia, esquemaEntrar, esquemaParamsDia, esquemaParamsPessoa, ROTAS,
  SENHA_BLOQUEIO_SEGUNDOS, SENHA_TENTATIVAS_MAX, type DadosConfirmacao, type DadosDia,
} from '@limpeza/shared';
import { exigirOrganizador } from '../../http/exigir-organizador.js';
import { limitarTentativas } from '../../http/limitar-tentativas.js';
import { validar } from '../../http/validar.js';
import * as servicoDeConfirmacoes from '../confirmacoes/servico.js';
import * as servicoDeDias from '../dias/servico.js';
import * as servico from './servico.js';

export const rotasDoOrganizador = Router();
const { organizador } = ROTAS;

/** O3: 5 senhas erradas SEGUIDAS (um acerto zera) bloqueiam o IP por 1 minuto. */
const limiteDeSenha = limitarTentativas({
  tipo: 'senha',
  maximo: SENHA_TENTATIVAS_MAX,
  janelaSegundos: Number.POSITIVE_INFINITY,
  bloqueioSegundos: SENHA_BLOQUEIO_SEGUNDOS,
  zerarAoAcertar: true,
});

const dia = { params: esquemaParamsDia, naoEncontrado: 'DIA_NAO_ENCONTRADO' } as const;
type ComDia = Request<{ id: string }>;

rotasDoOrganizador.post(
  organizador.entrar,
  limiteDeSenha.verificar,
  validar({ body: esquemaEntrar }),
  async (req: Request<object, unknown, { senha: string }>, res) => {
    res.json(await limiteDeSenha.contando(req, ['SENHA_INCORRETA'], () => servico.entrar(req.body.senha)));
  },
);

rotasDoOrganizador.post(organizador.sair, exigirOrganizador, async (_req, res: Response) => {
  await servico.sair(String(res.locals['sessaoId']));
  res.status(204).end();
});

rotasDoOrganizador.get(organizador.dias, exigirOrganizador, async (_req, res) => {
  res.json(await servicoDeDias.sextasDoOrganizador());
});

rotasDoOrganizador.get(organizador.sugestaoTarefas, exigirOrganizador, async (_req, res) => {
  res.json(await servicoDeDias.sugestaoDeTarefas());
});

rotasDoOrganizador.get(organizador.dia(':id'), exigirOrganizador, validar(dia), async (req: ComDia, res) => {
  res.json(await servicoDeDias.diaCompleto(req.params.id));
});

rotasDoOrganizador.post(
  organizador.dias,
  exigirOrganizador,
  validar({ body: esquemaDia }),
  async (req: Request<object, unknown, DadosDia>, res) => {
    res.status(201).json(await servicoDeDias.criar(req.body));
  },
);

rotasDoOrganizador.put(
  organizador.dia(':id'),
  exigirOrganizador,
  validar({ ...dia, body: esquemaDia }),
  async (req: Request<{ id: string }, unknown, DadosDia>, res) => {
    res.json(await servicoDeDias.editar(req.params.id, req.body));
  },
);

rotasDoOrganizador.delete(organizador.dia(':id'), exigirOrganizador, validar(dia), async (req: ComDia, res) => {
  await servicoDeDias.apagar(req.params.id);
  res.status(204).end();
});

rotasDoOrganizador.delete(
  organizador.pessoa(':id', ':pessoaId'),
  exigirOrganizador,
  validar({ params: esquemaParamsPessoa, naoEncontrado: 'PESSOA_NAO_ENCONTRADA' }),
  async (req: Request<{ id: string; pessoaId: string }>, res) => {
    res.json(await servicoDeConfirmacoes.removerPessoa(req.params.id, req.params.pessoaId));
  },
);

rotasDoOrganizador.post(
  organizador.pessoas(':id'),
  exigirOrganizador,
  validar({ ...dia, body: esquemaConfirmacao }),
  async (req: Request<{ id: string }, unknown, DadosConfirmacao>, res) => {
    res.status(201).json(await servicoDeConfirmacoes.desfazerRemocao(req.params.id, req.body));
  },
);
