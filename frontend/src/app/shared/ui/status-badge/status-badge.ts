/**
 * <app-status-badge tone="pending">Faltam 2</app-status-badge>: etiqueta com bolinha colorida.
 * O texto vem sempre junto da cor. Tons: ok, pending, missing e neutral (o Tom do shared).
 */
import { Component, input } from '@angular/core';
import type { Tom } from '@limpeza/shared';

@Component({
  selector: 'app-status-badge',
  template: '<ng-content />',
  host: {
    class: 'status',
    '[class.status--ok]': 'tone() === "ok"',
    '[class.status--pending]': 'tone() === "pending"',
    '[class.status--missing]': 'tone() === "missing"',
  },
})
export class StatusBadge {
  readonly tone = input<Tom>('neutral');
}
