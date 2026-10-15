/**
 * escala.ts: o estado da escala pública para todas as telas (docs/06) e as ações sobre ela.
 * Signals: dias, estado ('carregando' | 'pronto' | 'erro'), erro e proximo.
 */
import { computed, inject, Injectable, signal } from '@angular/core';
import { dataNaFrase, type DiaPublico, type EntradaConfirmacao, type Tarefa } from '@limpeza/compartilhado';
import { Notificacoes } from '@componentes';
import type { EstadoDaCarga } from '../comum/estado/estado';
import { Api, FalhaNaApi } from './api';
import { MinhasConfirmacoes } from './minhas-confirmacoes';

@Injectable({ providedIn: 'root' })
export class Escala {
  private readonly api = inject(Api);
  private readonly minhasConfirmacoes = inject(MinhasConfirmacoes);
  private readonly notificacoes = inject(Notificacoes);

  private readonly _dias = signal<DiaPublico[]>([]);
  readonly dias = this._dias.asReadonly();
  readonly estado = signal<EstadoDaCarga>('carregando');
  readonly erro = signal<string | null>(null);

  /** A próxima sexta (a escala já vem em ordem de data, de hoje em diante). */
  readonly proximo = computed<DiaPublico | undefined>(() => this._dias()[0]);

  async carregar(): Promise<void> {
    this.estado.set('carregando');
    try {
      const dias = await this.api.escala();
      this._dias.set(dias);
      this.minhasConfirmacoes.limparSumidas(dias);
      this.erro.set(null);
      this.estado.set('pronto');
    } catch (erro) {
      this.erro.set(erro instanceof FalhaNaApi ? erro.message : 'Não foi possível carregar a escala.');
      this.estado.set('erro');
    }
  }

  /** Recarrega sem voltar às linhas cinzas (depois de confirmar, cancelar…). */
  private async atualizar(): Promise<void> {
    try {
      const dias = await this.api.escala();
      this._dias.set(dias);
      this.minhasConfirmacoes.limparSumidas(dias);
    } catch {
      // Se falhar, a tela continua com o que já tinha; a próxima carga tenta de novo.
    }
  }

  buscar(diaId: string): DiaPublico | undefined {
    return this._dias().find((dia) => dia.id === diaId);
  }

  /**
   * C7, C8: confirma, guarda o código de cancelamento neste celular e mostra a notificação.
   * Erros (dados inválidos, sem vaga, telefone repetido…) seguem para a tela mostrar no formulário.
   */
  async confirmar(dia: DiaPublico, dados: EntradaConfirmacao): Promise<void> {
    const { pessoaId, codigoCancelamento } = await this.api.confirmar(dia.id, dados);
    this.minhasConfirmacoes.guardar({ diaId: dia.id, pessoaId, codigo: codigoCancelamento });
    this.notificacoes.mostrar(`Presença confirmada para ${dataNaFrase(dia.data)}.`);
    await this.atualizar();
  }

  /** X1, X5, X6: cancela pelo código guardado neste celular. */
  async cancelarMinhaPresenca(dia: DiaPublico): Promise<void> {
    const guardada = this.minhasConfirmacoes.daSexta(dia.id);
    if (!guardada) return;
    try {
      await this.api.cancelarPorCodigo(guardada.codigo);
      this.minhasConfirmacoes.esquecer(dia.id);
      this.notificacoes.mostrar('Presença cancelada.');
    } catch (erro) {
      if (erro instanceof FalhaNaApi && erro.codigo === 'CODIGO_INVALIDO') {
        // X6: o código não existe mais (pessoa removida ou sexta apagada): esquece em silêncio.
        this.minhasConfirmacoes.esquecer(dia.id);
      } else {
        this.notificarFalha(erro, () => this.cancelarMinhaPresenca(dia));
      }
    }
    await this.atualizar();
  }

  /** X2, X5: cancela pelo telefone. Erros (telefone que não confere, bloqueio) seguem para a janela. */
  async cancelarPorTelefone(dia: DiaPublico, telefone: string): Promise<void> {
    await this.api.cancelarPorTelefone(dia.id, telefone);
    this.notificacoes.mostrar('Presença cancelada.');
    await this.atualizar();
  }

  /**
   * T3, T4: a tela muda na hora. Se o servidor falhar, a marcação volta e aparece
   * "Tentar de novo". Ao marcar como feita, a notificação oferece "Desfazer".
   */
  async marcarTarefa(dia: DiaPublico, tarefa: Tarefa, feita: boolean): Promise<void> {
    this.trocarTarefa(dia.id, tarefa.id, feita);
    try {
      await this.api.marcarTarefa(dia.id, tarefa.id, feita);
      if (feita) {
        this.notificacoes.mostrar('Tarefa marcada como feita.', {
          acao: 'Desfazer',
          aoAgir: () => this.marcarTarefa(dia, tarefa, false),
        });
      }
    } catch (erro) {
      this.trocarTarefa(dia.id, tarefa.id, !feita);
      this.notificarFalha(erro, () => this.marcarTarefa(dia, tarefa, feita));
    }
  }

  private trocarTarefa(diaId: string, tarefaId: string, feita: boolean): void {
    this._dias.update((dias) =>
      dias.map((dia) =>
        dia.id !== diaId
          ? dia
          : { ...dia, tarefas: dia.tarefas.map((tarefa) => (tarefa.id === tarefaId ? { ...tarefa, feita } : tarefa)) },
      ),
    );
  }

  /** Erro de conexão ou do servidor: notificação de erro com "Tentar de novo" (regra 2 do docs/06). */
  private notificarFalha(erro: unknown, tentarDeNovo: () => void): void {
    const mensagem = erro instanceof FalhaNaApi ? erro.message : 'Algo deu errado. Tente de novo em instantes.';
    this.notificacoes.erro(mensagem, { acao: 'Tentar de novo', aoAgir: tentarDeNovo });
  }
}
