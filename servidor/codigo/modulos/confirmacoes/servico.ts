/** Regras de confirmação e cancelamento de presença (C1–C8, X1–X6). */
import { vagasLivres, type DadosConfirmacao, type PessoaCompleta } from '@limpeza/compartilhado';
import { bd } from '../../banco/cliente.js';
import type { Confirmacao } from '../../banco/esquema.js';
import { emTransacao } from '../../banco/transacao.js';
import { ErroDeRegra } from '../../comum/erros.js';
import { comRestricaoUnica } from '../../comum/erros-do-banco.js';
import { paraPessoaCompleta } from '../../comum/mapeadores.js';
import { BYTES_DO_CODIGO, gerarToken, hashDeToken } from '../../comum/seguranca.js';
import * as repositorioDeDias from '../dias/repositorio.js';
import { exigirNaoPassada } from '../dias/exigir-nao-passada.js';
import * as repositorio from './repositorio.js';

/**
 * Põe uma pessoa na escala: usado por "confirmar presença" e pelo "desfazer remoção" (O5).
 * A linha da limpeza fica travada durante a transação: duas pessoas na última vaga ao mesmo tempo
 * são atendidas uma de cada vez, e a segunda recebe SEM_VAGA (C5).
 * Devolve a pessoa e o código de cancelamento puro, que só sai daqui uma vez (C7).
 */
export async function adicionarPessoa(
  diaId: string,
  dados: DadosConfirmacao,
): Promise<{ pessoa: Confirmacao; codigo: string }> {
  const codigo = gerarToken(BYTES_DO_CODIGO);
  // Garantia extra do banco (C4), caso duas confirmações iguais cheguem juntas.
  return comRestricaoUnica('confirmacoes_telefone_unico_no_dia', 'TELEFONE_REPETIDO', () =>
    emTransacao(async (tx) => {
      const dia = await repositorioDeDias.buscarTravando(tx, diaId);
      exigirNaoPassada(dia);
      if (await repositorio.buscarPorTelefone(tx, diaId, dados.telefone)) {
        throw new ErroDeRegra('TELEFONE_REPETIDO');
      }
      const confirmados = await repositorio.contarDoDia(tx, diaId);
      if (vagasLivres({ vagas: dia.vagas, pessoas: { length: confirmados } }) === 0) {
        throw new ErroDeRegra('SEM_VAGA');
      }
      const pessoa = await repositorio.inserir(tx, { ...dados, diaId, codigoCancelamentoHash: hashDeToken(codigo) });
      return { pessoa, codigo };
    }),
  );
}

/** X1: cancelar pelo código guardado no celular. */
export async function cancelarPorCodigo(codigo: string): Promise<void> {
  const confirmacao = await repositorio.buscarPorCodigo(hashDeToken(codigo));
  exigirNaoPassada(confirmacao, 'CODIGO_INVALIDO');
  await repositorio.apagar(confirmacao.id);
}

/**
 * O5: o organizador tira alguém da escala. Quem já marcou presença não sai: remover e "Desfazer" apagaria
 * adesão, EPI, horários e a assinatura, que nem o organizador pode recriar (L7). Primeiro ele apaga a entrada
 * em "Corrigir presença". Devolve os dados removidos, para o "Desfazer".
 */
export async function removerPessoa(diaId: string, pessoaId: string): Promise<PessoaCompleta> {
  const pessoa = await repositorio.buscarDoDia(bd, diaId, pessoaId);
  if (!pessoa) throw new ErroDeRegra('PESSOA_NAO_ENCONTRADA');
  if (pessoa.entrada) throw new ErroDeRegra('PRESENCA_MARCADA');
  const removida = await repositorio.apagarDoDia(diaId, pessoaId);
  if (!removida) throw new ErroDeRegra('PESSOA_NAO_ENCONTRADA');
  return paraPessoaCompleta(removida);
}

/**
 * O5, "Desfazer": recria a confirmação com os mesmos dados. Aplica C3, C4 e C5 (é o mesmo
 * adicionarPessoa do "confirmar"). O código de cancelamento antigo deixa de valer (X6).
 */
export async function desfazerRemocao(diaId: string, dados: DadosConfirmacao): Promise<PessoaCompleta> {
  const { pessoa } = await adicionarPessoa(diaId, dados);
  return paraPessoaCompleta(pessoa);
}

/** X2: cancelar digitando o telefone usado na confirmação daquela limpeza. */
export async function cancelarPorTelefone(diaId: string, telefone: string): Promise<void> {
  exigirNaoPassada(await repositorioDeDias.buscar(diaId));
  if (!(await repositorio.apagarPorTelefone(diaId, telefone))) throw new ErroDeRegra('TELEFONE_NAO_CONFERE');
}
