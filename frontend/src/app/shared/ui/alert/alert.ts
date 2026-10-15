/**
 * <app-alert>: aviso que não some (Alert). Erro de formulário no topo, erro de carregamento, avisos gerais.
 *   <app-alert tone="error" title="Faltam 2 informações.">Confira os campos marcados abaixo.</app-alert>
 */
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alert',
  template: `
    <div>
      @if (title()) {
        <!-- O Angular apaga espaços entre elementos; este garante "Título. Texto". -->
        <span class="alert__title">{{ title() }}</span>{{ ' ' }}
      }
      <ng-content />
    </div>
  `,
  host: {
    class: 'alert',
    '[class.alert--error]': 'tone() === "error"',
    '[class.alert--success]': 'tone() === "success"',
    '[attr.role]': 'tone() === "error" ? "alert" : "status"',
  },
})
export class Alert {
  readonly tone = input<'info' | 'error' | 'success'>('info');
  readonly title = input<string>();
}
