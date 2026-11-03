/**
 * Endereços do organizador (docs/04-api.md). Todos exigem a sessão (exigirOrganizador), menos "entrar".
 */
import { Router, type Request, type Response } from 'express';
import {
  esquemaConfirmacao, esquemaCorrecaoPresenca, esquemaDia, esquemaEncerrar, esquemaEntrar, esquemaParametrosPessoa,
  esquemaPessoaNaPresenca, ROTAS,
  SENHA_BLOQUEIO_SEGUNDOS, SENHA_TENTATIVAS_MAX, type DadosConfirmacao, type DadosCorrecaoPresenca, type DadosDia, type DadosPessoaNaPresenca,
} from '@limpeza/compartilhado';
import { exigirOrganizador } from '../../http/exigir-organizador.js';
import { limitarTentativas } from '../../http/limitar-tentativas.js';
import { DIA_VALIDO, validar } from '../../http/validar.js';
import * as servicoDeConfirmacoes from '../confirmacoes/servico.js';
import * as servicoDeDias from '../dias/servico.js';
import * as servicoDePresenca from '../presenca/servico.js';
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

type ComDia = Request<{ id: string }>;

rotasDoOrganizador.post(
  organizador.entrar,
  limiteDeSenha.verificar,
  validar({ corpo: esquemaEntrar }),
  async (requisicao: Request<object, unknown, { senha: string }>, resposta) => {
    resposta.json(await limiteDeSenha.contando(requisicao, ['SENHA_INCORRETA'], () => servico.entrar(requisicao.body.senha)));
  },
);

rotasDoOrganizador.post(organizador.sair, exigirOrganizador, async (_requisicao, resposta: Response) => {
  await servico.sair(String(resposta.locals['sessaoId']));
  resposta.status(204).end();
});

rotasDoOrganizador.get(organizador.dias, exigirOrganizador, async (_requisicao, resposta) => {
  resposta.json(await servicoDeDias.limpezasDoOrganizador());
});

rotasDoOrganizador.get(organizador.sugestaoTarefas, exigirOrganizador, async (_requisicao, resposta) => {
  resposta.json(await servicoDeDias.sugestaoDeTarefas());
});

rotasDoOrganizador.get(organizador.dia(':id'), exigirOrganizador, validar(DIA_VALIDO), async (requisicao: ComDia, resposta) => {
  resposta.json(await servicoDeDias.diaCompleto(requisicao.params.id));
});

rotasDoOrganizador.post(
  organizador.dias,
  exigirOrganizador,
  validar({ corpo: esquemaDia }),
  async (requisicao: Request<object, unknown, DadosDia>, resposta) => {
    resposta.status(201).json(await servicoDeDias.criar(requisicao.body));
  },
);

rotasDoOrganizador.put(
  organizador.dia(':id'),
  exigirOrganizador,
  validar({ ...DIA_VALIDO, corpo: esquemaDia }),
  async (requisicao: Request<{ id: string }, unknown, DadosDia>, resposta) => {
    resposta.json(await servicoDeDias.editar(requisicao.params.id, requisicao.body));
  },
);

rotasDoOrganizador.delete(organizador.dia(':id'), exigirOrganizador, validar(DIA_VALIDO), async (requisicao: ComDia, resposta) => {
  await servicoDeDias.apagar(requisicao.params.id);
  resposta.status(204).end();
});

rotasDoOrganizador.delete(
  organizador.pessoa(':id', ':pessoaId'),
  exigirOrganizador,
  validar({ parametros: esquemaParametrosPessoa, naoEncontrado: 'PESSOA_NAO_ENCONTRADA' }),
  async (requisicao: Request<{ id: string; pessoaId: string }>, resposta) => {
    resposta.json(await servicoDeConfirmacoes.removerPessoa(requisicao.params.id, requisicao.params.pessoaId));
  },
);

rotasDoOrganizador.post(
  organizador.pessoas(':id'),
  exigirOrganizador,
  validar({ ...DIA_VALIDO, corpo: esquemaConfirmacao }),
  async (requisicao: Request<{ id: string }, unknown, DadosConfirmacao>, resposta) => {
    resposta.status(201).json(await servicoDeConfirmacoes.desfazerRemocao(requisicao.params.id, requisicao.body));
  },
);

rotasDoOrganizador.put(
  organizador.presenca(':id', ':pessoaId'),
  exigirOrganizador,
  validar({ parametros: esquemaParametrosPessoa, naoEncontrado: 'PESSOA_NAO_ENCONTRADA', corpo: esquemaCorrecaoPresenca }),
  async (requisicao: Request<{ id: string; pessoaId: string }, unknown, DadosCorrecaoPresenca>, resposta) => {
    resposta.json(await servicoDePresenca.corrigir(requisicao.params.id, requisicao.params.pessoaId, requisicao.body));
  },
);

rotasDoOrganizador.post(
  organizador.encerrar(':id'),
  exigirOrganizador,
  validar({ ...DIA_VALIDO, corpo: esquemaEncerrar }),
  async (requisicao: Request<{ id: string }, unknown, { saida?: string }>, resposta) => {
    resposta.json(await servicoDePresenca.encerrar(requisicao.params.id, requisicao.body.saida));
  },
);

rotasDoOrganizador.post(
  organizador.presencaNova(':id'),
  exigirOrganizador,
  validar({ ...DIA_VALIDO, corpo: esquemaPessoaNaPresenca }),
  async (requisicao: Request<{ id: string }, unknown, DadosPessoaNaPresenca>, resposta) => {
    resposta.status(201).json(await servicoDePresenca.adicionar(requisicao.params.id, requisicao.body));
  },
);
