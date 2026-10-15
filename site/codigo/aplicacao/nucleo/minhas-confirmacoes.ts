/**
 * O que este celular lembra das próprias confirmações (C7, X1, X6): a chave "confirmacoes" do
 * localStorage, com uma lista de { diaId, pessoaId, codigo }. O código é o de cancelamento,
 * que o servidor devolve uma vez só. Todo acesso ao armazenamento é seguro (armazenamento.ts).
 */
import { Injectable, signal } from '@angular/core';
import type { DiaPublico } from '@limpeza/compartilhado';
import { gravar, ler } from './armazenamento';

const CHAVE = 'confirmacoes';

export interface ConfirmacaoGuardada {
  diaId: string;
  pessoaId: string;
  codigo: string;
}

function ehConfirmacaoGuardada(valor: unknown): valor is ConfirmacaoGuardada {
  const item = valor as Partial<ConfirmacaoGuardada> | null;
  return (
    typeof item === 'object' && item !== null &&
    typeof item.diaId === 'string' && typeof item.pessoaId === 'string' && typeof item.codigo === 'string'
  );
}

/** Lê a lista guardada; qualquer coisa estranha (texto quebrado, formato antigo) vira lista vazia. */
function lerGuardadas(): ConfirmacaoGuardada[] {
  try {
    const lista: unknown = JSON.parse(ler('local', CHAVE) ?? '[]');
    return Array.isArray(lista) ? lista.filter(ehConfirmacaoGuardada) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class MinhasConfirmacoes {
  private readonly _lista = signal<ConfirmacaoGuardada[]>(lerGuardadas());
  readonly lista = this._lista.asReadonly();

  private salvar(lista: ConfirmacaoGuardada[]): void {
    this._lista.set(lista);
    gravar('local', CHAVE, JSON.stringify(lista));
  }

  /** C7: guarda o código depois de confirmar (uma por sexta). */
  guardar(confirmacao: ConfirmacaoGuardada): void {
    this.salvar([...this._lista().filter((item) => item.diaId !== confirmacao.diaId), confirmacao]);
  }

  /** A confirmação deste celular naquela sexta, se houver. */
  daSexta(diaId: string): ConfirmacaoGuardada | undefined {
    return this._lista().find((item) => item.diaId === diaId);
  }

  /** X1: este celular confirmou nesta sexta (e a pessoa ainda está na escala)? */
  confirmouEm(dia: Pick<DiaPublico, 'id' | 'pessoas'>): boolean {
    const guardada = this.daSexta(dia.id);
    return Boolean(guardada && dia.pessoas.some((pessoa) => pessoa.id === guardada.pessoaId));
  }

  /** X5: depois de cancelar, o código é apagado. */
  esquecer(diaId: string): void {
    this.salvar(this._lista().filter((item) => item.diaId !== diaId));
  }

  /**
   * X6: apaga, sem avisar, as confirmações cuja pessoa não aparece mais na sexta
   * (o organizador removeu, ou a pessoa cancelou pelo telefone em outro aparelho).
   * Sextas que não vieram na lista não são mexidas (podem só estar fora das 8 próximas).
   */
  limparSumidas(dias: Pick<DiaPublico, 'id' | 'pessoas'>[]): void {
    const sumidas = this._lista().filter((item) => {
      const dia = dias.find((d) => d.id === item.diaId);
      return dia !== undefined && !dia.pessoas.some((pessoa) => pessoa.id === item.pessoaId);
    });
    if (sumidas.length > 0) this.salvar(this._lista().filter((item) => !sumidas.includes(item)));
  }
}
