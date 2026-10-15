/**
 * Mostra que o app está esperando o servidor (Spinner do Design System).
 * - <app-girando />: círculo girando (dentro de botão já fica no tamanho certo pelo CSS do DS).
 * - <app-carregando>Carregando a escala…</app-carregando>: bloco com o texto do que está carregando.
 */
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-girando',
  template: '',
  host: { class: 'spinner', '[class.spinner--sm]': 'tamanho() === "pequeno"', 'aria-hidden': 'true' },
})
export class Girando {
  readonly tamanho = input<'normal' | 'pequeno'>('normal');
}

@Component({
  selector: 'app-carregando',
  imports: [Girando],
  template: '<app-girando tamanho="pequeno" /><ng-content />',
  host: { class: 'loading', role: 'status' },
})
export class Carregando {}
