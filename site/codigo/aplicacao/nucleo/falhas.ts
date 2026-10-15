/**
 * Como o site mostra uma falha da API, num lugar só:
 * - a mensagem é a do catálogo do compartilhado (ou "Algo deu errado…" se não for da API);
 * - sem conexão (e falhas fora de formulário) vira notificação de erro com "Tentar de novo"
 *   (regra de interação 2 do docs/06).
 */
import { mensagemDoErro } from '@limpeza/compartilhado';
import type { Notificacoes } from '@componentes';
import { FalhaNaApi } from './api';

export function mensagemDaFalha(erro: unknown): string {
  return erro instanceof FalhaNaApi ? erro.message : mensagemDoErro('ERRO_INTERNO');
}

export function ehSemConexao(erro: unknown): boolean {
  return erro instanceof FalhaNaApi && erro.codigo === 'SEM_CONEXAO';
}

/** Notificação de erro; com `tentarDeNovo`, ganha o botão "Tentar de novo". */
export function notificarFalha(notificacoes: Notificacoes, erro: unknown, tentarDeNovo?: () => void): void {
  notificacoes.erro(mensagemDaFalha(erro), tentarDeNovo ? { acao: 'Tentar de novo', aoAgir: tentarDeNovo } : {});
}
