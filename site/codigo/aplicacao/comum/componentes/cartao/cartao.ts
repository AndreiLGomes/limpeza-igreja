/**
 * <app-cartao>: caixa de um item, como um dia de limpeza (Card do Design System). Fica sobre o fundo surface-alt.
 * Encaixes: [situacaoDoCartao] (canto de cima, à direita) e [acoesDoCartao] (botões no fim); o resto vai no meio.
 *
 *   <app-cartao titulo="Sexta, 16 de outubro" detalhes="19h às 21h · 3 de 5 vagas preenchidas">
 *     <app-etiqueta situacaoDoCartao tom="pendente">Faltam 2</app-etiqueta>
 *     <app-grupo-de-avatares [nomes]="nomes" [total]="5" />
 *     <div acoesDoCartao>…</div>
 *   </app-cartao>
 */
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cartao',
  template: `
    <article class="card">
      <div class="card__head">
        <div>
          <h3 class="card__title">{{ titulo() }}</h3>
          @if (detalhes()) {
            <p class="card__meta">{{ detalhes() }}</p>
          }
        </div>
        <ng-content select="[situacaoDoCartao]" />
      </div>
      <ng-content />
      <div class="card__actions">
        <ng-content select="[acoesDoCartao]" />
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
export class Cartao {
  readonly titulo = input.required<string>();
  /** Linha cinza embaixo do título, ex.: "19h às 21h · 3 de 5 vagas preenchidas". */
  readonly detalhes = input<string>();
}
