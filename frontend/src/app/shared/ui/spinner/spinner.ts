/**
 * Spinner: mostra que o app está esperando o servidor.
 * - <app-spinner />: círculo girando (dentro de botão já fica no tamanho certo pelo CSS do DS).
 * - <app-loading>Carregando a escala…</app-loading>: bloco com o texto do que está carregando.
 */
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: '',
  host: { class: 'spinner', '[class.spinner--sm]': 'size() === "sm"', 'aria-hidden': 'true' },
})
export class Spinner {
  readonly size = input<'md' | 'sm'>('md');
}

@Component({
  selector: 'app-loading',
  imports: [Spinner],
  template: '<app-spinner size="sm" /><ng-content />',
  host: { class: 'loading', role: 'status' },
})
export class Loading {}
