/**
 * escala.ts: o estado da escala pública para todas as telas (docs/06) e as ações sobre ela.
 * Signals: dias, estado ('carregando' | 'pronto' | 'erro'), erro e proximo.
 */
import { computed, inject, Injectable } from '@angular/core';
import { dataNaFrase, type DiaPublico, type EntradaConfirmacao, type Tarefa } from '@limpeza/compartilhado';
import { Notificacoes } from '@componentes';
import { Api, FalhaNaApi } from './api';
import { Carga } from './carga';
import { notificarFalha } from './falhas';
import { MinhasConfirmacoes } from './minhas-confirmacoes';

@Injectable({ providedIn: 'root' })
export class Escala {
  private readonly api = inject(Api);
  private readonly minhasConfirmacoes = inject(MinhasConfirmacoes);
  private readonly notificacoes = inject(Notificacoes);

  /** A escala pública (S12); depois de cada carga, esquece as confirmações que sumiram (X6). */
  private readonly carga = new Carga<DiaPublico[]>(() => this.api.escala(), [], (dias) =>
    this.minhasConfirmacoes.limparSumidas(dias),
  );
  readonly dias = this.carga.dados.asReadonly();
  readonly estado = this.carga.estado.asReadonly();
  readonly erro = this.carga.erro.asReadonly();

  /** A próxima limpeza (a escala já vem em ordem de data, de hoje em diante). */
  readonly proximo = computed<DiaPublico | undefined>(() => this.dias()[0]);

  carregar(): Promise<void> {
    return this.carga.carregar();
  }

  /** Recarrega sem voltar às linhas cinzas (depois de confirmar, cancelar…). */
  private atualizar(): Promise<void> {
    return this.carga.atualizar();
  }

  buscar(diaId: string): DiaPublico | undefined {
    return this.dias().find((dia) => dia.id === diaId);
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
    const guardada = this.minhasConfirmacoes.daLimpeza(dia.id);
    if (!guardada) return;
    try {
      await this.api.cancelarPorCodigo(guardada.codigo);
      this.minhasConfirmacoes.esquecer(dia.id);
      this.notificacoes.mostrar('Presença cancelada.');
    } catch (erro) {
      if (erro instanceof FalhaNaApi && erro.codigo === 'CODIGO_INVALIDO') {
        // X6: o código não existe mais (pessoa removida ou limpeza apagada): esquece em silêncio.
        this.minhasConfirmacoes.esquecer(dia.id);
      } else {
        notificarFalha(this.notificacoes, erro, () => this.cancelarMinhaPresenca(dia));
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
      notificarFalha(this.notificacoes, erro, () => this.marcarTarefa(dia, tarefa, feita));
    }
  }

  private trocarTarefa(diaId: string, tarefaId: string, feita: boolean): void {
    this.carga.dados.update((dias) =>
      dias.map((dia) =>
        dia.id !== diaId
          ? dia
          : { ...dia, tarefas: dia.tarefas.map((tarefa) => (tarefa.id === tarefaId ? { ...tarefa, feita } : tarefa)) },
      ),
    );
  }

}
