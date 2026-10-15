/**
 * <app-card>: caixa de um item, como um dia de limpeza. Fica sobre o fundo surface-alt.
 * Encaixes: [cardStatus] (canto de cima, à direita) e [cardActions] (botões no fim); o resto vai no meio.
 *
 *   <app-card title="Sexta, 16 de outubro" meta="19h às 21h · 3 de 5 vagas preenchidas">
 *     <app-status-badge cardStatus tone="pending">Faltam 2</app-status-badge>
 *     <app-avatar-stack [names]="nomes" [total]="5" />
 *     <div cardActions>…</div>
 *   </app-card>
 */
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <article class="card">
      <div class="card__head">
        <div>
          <h3 class="card__title">{{ title() }}</h3>
          @if (meta()) {
            <p class="card__meta">{{ meta() }}</p>
          }
        </div>
        <ng-content select="[cardStatus]" />
      </div>
      <ng-content />
      <div class="card__actions">
        <ng-content select="[cardActions]" />
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    /* Sem botões, a linha de ações não ocupa espaço. */
    .card__actions:empty {
      display: none;
    }
  `,
})
export class Card {
  readonly title = input.required<string>();
  readonly meta = input<string>();
}
