import { Router, type Request } from 'express';
import {
  CANCELAMENTO_BLOQUEIO_SEGUNDOS, CANCELAMENTO_JANELA_SEGUNDOS, CANCELAMENTO_TENTATIVAS_MAX,
  esquemaCancelarPorCodigo, esquemaCancelarPorTelefone, esquemaConfirmacao, esquemaParamsDia, ROTAS,
  type ConfirmacaoCriada, type DadosConfirmacao,
} from '@limpeza/shared';
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

const diaValido = { params: esquemaParamsDia, naoEncontrado: 'DIA_NAO_ENCONTRADO' } as const;

rotasDeConfirmacoes.post(
  ROTAS.confirmar(':id'),
  validar({ ...diaValido, body: esquemaConfirmacao }),
  async (req: Request<{ id: string }, unknown, DadosConfirmacao>, res) => {
    const { pessoa, codigo } = await servico.adicionarPessoa(req.params.id, req.body);
    const resposta: ConfirmacaoCriada = { pessoaId: pessoa.id, codigoCancelamento: codigo };
    res.status(201).json(resposta);
  },
);

rotasDeConfirmacoes.post(
  ROTAS.cancelarPorCodigo,
  validar({ body: esquemaCancelarPorCodigo }),
  async (req: Request<object, unknown, { codigoCancelamento: string }>, res) => {
    await servico.cancelarPorCodigo(req.body.codigoCancelamento);
    res.status(204).end();
  },
);

rotasDeConfirmacoes.post(
  ROTAS.cancelarPorTelefone(':id'),
  limiteDeCancelamento.verificar,
  validar({ ...diaValido, body: esquemaCancelarPorTelefone }),
  async (req: Request<{ id: string }, unknown, { telefone: string }>, res) => {
    await limiteDeCancelamento.contando(req, ['TELEFONE_NAO_CONFERE'], () =>
      servico.cancelarPorTelefone(req.params.id, req.body.telefone),
    );
    res.status(204).end();
  },
);
