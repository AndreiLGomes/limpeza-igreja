import { Router, type Request } from 'express';
import {
  CANCELAMENTO_BLOQUEIO_SEGUNDOS, CANCELAMENTO_JANELA_SEGUNDOS, CANCELAMENTO_TENTATIVAS_MAX,
  esquemaCancelarPorCodigo, esquemaCancelarPorTelefone, esquemaConfirmacao, esquemaParametrosDia, ROTAS,
  type ConfirmacaoCriada, type DadosConfirmacao,
} from '@limpeza/compartilhado';
import { limitarTentativas } from '../../http/limitar-tentativas.js';
import { validar } from '../../http/validar.js';
import * as servico from './servico.js';

export const rotasDeConfirmacoes = Router();

/** X3: 5 telefones errados em 10 minutos bloqueiam o IP por 10 minutos. */
const limiteDeCancelamento = limitarTentativas({
  tipo: 'cancelamento',
  maximo: CANCELAMENTO_TENTATIVAS_MAX,
  janelaSegundos: CANCELAMENTO_JANELA_SEGUNDOS,
  bloqueioSegundos: CANCELAMENTO_BLOQUEIO_SEGUNDOS,
});

const diaValido = { parametros: esquemaParametrosDia, naoEncontrado: 'DIA_NAO_ENCONTRADO' } as const;

rotasDeConfirmacoes.post(
  ROTAS.confirmar(':id'),
  validar({ ...diaValido, corpo: esquemaConfirmacao }),
  async (requisicao: Request<{ id: string }, unknown, DadosConfirmacao>, resposta) => {
    const { pessoa, codigo } = await servico.adicionarPessoa(requisicao.params.id, requisicao.body);
    const criada: ConfirmacaoCriada = { pessoaId: pessoa.id, codigoCancelamento: codigo };
    resposta.status(201).json(criada);
  },
);

rotasDeConfirmacoes.post(
  ROTAS.cancelarPorCodigo,
  validar({ corpo: esquemaCancelarPorCodigo }),
  async (requisicao: Request<object, unknown, { codigoCancelamento: string }>, resposta) => {
    await servico.cancelarPorCodigo(requisicao.body.codigoCancelamento);
    resposta.status(204).end();
  },
);

rotasDeConfirmacoes.post(
  ROTAS.cancelarPorTelefone(':id'),
  limiteDeCancelamento.verificar,
  validar({ ...diaValido, corpo: esquemaCancelarPorTelefone }),
  async (requisicao: Request<{ id: string }, unknown, { telefone: string }>, resposta) => {
    await limiteDeCancelamento.contando(requisicao, ['TELEFONE_NAO_CONFERE'], () =>
      servico.cancelarPorTelefone(requisicao.params.id, requisicao.body.telefone),
    );
    resposta.status(204).end();
  },
);
