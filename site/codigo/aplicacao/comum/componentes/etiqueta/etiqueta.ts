/**
 * <app-etiqueta tom="pendente">Faltam 2</app-etiqueta>: etiqueta com bolinha colorida (StatusBadge).
 * O texto vem sempre junto da cor. Tons: ok, pendente, faltando e neutro (o Tom do compartilhado).
 */
import { Component, input } from '@angular/core';
import type { Tom } from '@limpeza/compartilhado';

@Component({
  selector: 'app-etiqueta',
  template: '<ng-content />',
  host: {
    class: 'status',
    '[class.status--ok]': 'tom() === "ok"',
    '[class.status--pending]': 'tom() === "pendente"',
    '[class.status--missing]': 'tom() === "faltando"',
  },
})
export class Etiqueta {
  readonly tom = input<Tom>('neutro');
}
