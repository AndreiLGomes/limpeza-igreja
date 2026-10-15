/** Regras de confirmação e cancelamento de presença (C1–C8, X1–X6). */
import { vagasLivres, type DadosConfirmacao } from '@limpeza/shared';
import type { Confirmacao } from '../../banco/esquema.js';
import { emTransacao } from '../../banco/transacao.js';
import { ErroApp } from '../../comum/erros.js';
import { violouUnico } from '../../comum/erros-do-banco.js';
import { BYTES_DO_CODIGO, gerarToken, hashDeToken } from '../../comum/seguranca.js';
import * as repositorioDeDias from '../dias/repositorio.js';
import { exigirNaoPassada } from '../dias/servico.js';
import * as repositorio from './repositorio.js';

/**
 * Põe uma pessoa na escala: usado por "confirmar presença" e, na Etapa 5, pelo "desfazer remoção" (O5).
 * A linha da sexta fica travada durante a transação: duas pessoas na última vaga ao mesmo tempo
 * são atendidas uma de cada vez, e a segunda recebe SEM_VAGA (C5).
 * Devolve a pessoa e o código de cancelamento puro, que só sai daqui uma vez (C7).
 */
export async function adicionarPessoa(
  diaId: string,
  dados: DadosConfirmacao,
): Promise<{ pessoa: Confirmacao; codigo: string }> {
  const codigo = gerarToken(BYTES_DO_CODIGO);
  try {
    return await emTransacao(async (tx) => {
      const dia = await repositorioDeDias.buscarTravando(tx, diaId);
      exigirNaoPassada(dia);
      if (await repositorio.telefoneJaConfirmado(tx, diaId, dados.telefone)) {
        throw new ErroApp('TELEFONE_REPETIDO');
      }
      const confirmados = await repositorio.contarDoDia(tx, diaId);
      if (vagasLivres({ vagas: dia.vagas, pessoas: { length: confirmados } }) === 0) {
        throw new ErroApp('SEM_VAGA');
      }
      const pessoa = await repositorio.inserir(tx, { ...dados, diaId, codigoCancelamentoHash: hashDeToken(codigo) });
      return { pessoa, codigo };
    });
  } catch (erro) {
    // Garantia extra do banco (C4), caso duas confirmações iguais cheguem juntas.
    if (violouUnico(erro, 'confirmacoes_telefone_unico_no_dia')) throw new ErroApp('TELEFONE_REPETIDO');
    throw erro;
  }
}

/** X1: cancelar pelo código guardado no celular. */
export async function cancelarPorCodigo(codigo: string): Promise<void> {
  const confirmacao = await repositorio.buscarPorCodigo(hashDeToken(codigo));
  exigirNaoPassada(confirmacao, 'CODIGO_INVALIDO');
  await repositorio.apagar(confirmacao.id);
}

/** X2: cancelar digitando o telefone usado na confirmação daquela sexta. */
export async function cancelarPorTelefone(diaId: string, telefone: string): Promise<void> {
  exigirNaoPassada(await repositorioDeDias.buscar(diaId));
  if (!(await repositorio.apagarPorTelefone(diaId, telefone))) throw new ErroApp('TELEFONE_NAO_CONFERE');
}
