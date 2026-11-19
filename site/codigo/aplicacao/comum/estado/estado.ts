/**
 * <app-estado [estado]="escala.estado()" [erro]="escala.erro()" (tentar)="escala.carregar()">
 *   conteúdo pronto
 * </app-estado>
 * Os três estados de toda tela com dados do servidor (TelaEstados):
 * - carregando: linhas cinzas no formato de um cartão (skeleton), não uma tela branca. Se demorar mais que
 *   ESPERA_PARA_AVISAR_MS, aparece o aviso de que o servidor está iniciando (a hospedagem gratuita desliga o
 *   servidor quando ninguém usa e leva até 1 minuto para ligar de novo);
 * - erro: aviso que não some + "Tentar de novo";
 * - pronto: o conteúdo de dentro.
 */
import { Component, effect, input, output, signal } from '@angular/core';
import { Aviso, Botao } from '@componentes';

export type EstadoDaCarga = 'carregando' | 'pronto' | 'erro';

/** Depois de quanto tempo carregando aparece o aviso de servidor iniciando. */
export const ESPERA_PARA_AVISAR_MS = 4000;

@Component({
  selector: 'app-estado',
  imports: [Aviso, Botao],
  template: `
    @switch (estado()) {
      @case ('carregando') {
        @if (demorando()) {
          <app-aviso titulo="O servidor está iniciando.">
            Quando o app fica um tempo sem uso, ele leva até 1 minuto para ligar. Pode esperar nesta tela.
          </app-aviso>
        }
        <article class="card" aria-hidden="true">
          <span class="skeleton linha-cinza--titulo"></span>
          <span class="skeleton linha-cinza--texto"></span>
          <span class="skeleton linha-cinza--bloco"></span>
        </article>
        <span class="so-leitor" role="status">{{ textoCarregando() }}</span>
      }
      @case ('erro') {
        <app-aviso tom="erro" titulo="Não foi possível carregar.">{{ erro() }}</app-aviso>
        <button appBotao variante="secundario" larguraToda type="button" (click)="tentar.emit()">Tentar de novo</button>
      }
      @default {
        <ng-content />
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }
    .linha-cinza--titulo {
      width: 60%;
      height: var(--space-6);
    }
    .linha-cinza--texto {
      width: 80%;
    }
    .linha-cinza--bloco {
      width: 40%;
      height: var(--space-8);
    }
  `,
})
export class Estado {
  readonly estado = input.required<EstadoDaCarga>();
  readonly erro = input<string | null>(null);
  readonly textoCarregando = input('Carregando…');
  readonly tentar = output<void>();

  /** Já está carregando há mais de ESPERA_PARA_AVISAR_MS. */
  protected readonly demorando = signal(false);

  constructor() {
    effect((aoLimpar) => {
      this.demorando.set(false);
      if (this.estado() !== 'carregando') return;
      const espera = setTimeout(() => this.demorando.set(true), ESPERA_PARA_AVISAR_MS);
      aoLimpar(() => clearTimeout(espera));
    });
  }
}
