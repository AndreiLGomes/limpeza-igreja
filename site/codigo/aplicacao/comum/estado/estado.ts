/**
 * <app-estado [estado]="escala.estado()" [erro]="escala.erro()" (tentar)="escala.carregar()">
 *   conteúdo pronto
 * </app-estado>
 * Os três estados de toda tela com dados do servidor (TelaEstados):
 * - carregando: linhas cinzas no formato de um cartão (skeleton), não uma tela branca;
 * - erro: aviso que não some + "Tentar de novo";
 * - pronto: o conteúdo de dentro.
 */
import { Component, input, output } from '@angular/core';
import { Aviso, Botao } from '@componentes';

export type EstadoDaCarga = 'carregando' | 'pronto' | 'erro';

@Component({
  selector: 'app-estado',
  imports: [Aviso, Botao],
  template: `
    @switch (estado()) {
      @case ('carregando') {
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
}
