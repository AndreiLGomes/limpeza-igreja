/**
 * <app-estado [estado]="escala.estado()" [erro]="escala.erro()" (tentar)="escala.carregar()">
 *   conteúdo pronto
 * </app-estado>
 * Os três estados de toda tela com dados do servidor (TelaEstados):
 * - carregando: linhas cinzas no formato de um card (skeleton), não uma tela branca;
 * - erro: Alert que não some + "Tentar de novo";
 * - pronto: o conteúdo de dentro.
 */
import { Component, input, output } from '@angular/core';
import { Alert, Button } from '@ui';

export type EstadoDaCarga = 'carregando' | 'pronto' | 'erro';

@Component({
  selector: 'app-estado',
  imports: [Alert, Button],
  template: `
    @switch (estado()) {
      @case ('carregando') {
        <article class="card" aria-hidden="true">
          <span class="skeleton skeleton--titulo"></span>
          <span class="skeleton skeleton--linha"></span>
          <span class="skeleton skeleton--bloco"></span>
        </article>
        <span class="so-leitor" role="status">{{ textoCarregando() }}</span>
      }
      @case ('erro') {
        <app-alert tone="error" title="Não foi possível carregar.">{{ erro() }}</app-alert>
        <button appButton variant="secondary" block type="button" (click)="tentar.emit()">Tentar de novo</button>
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
    .skeleton--titulo {
      width: 60%;
      height: var(--space-6);
    }
    .skeleton--linha {
      width: 80%;
    }
    .skeleton--bloco {
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
}
