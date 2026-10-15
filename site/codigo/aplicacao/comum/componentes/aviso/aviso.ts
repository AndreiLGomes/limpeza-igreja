/**
 * <app-aviso>: aviso que não some (Alert do Design System). Erro de formulário no topo, erro de
 * carregamento, avisos gerais.
 *   <app-aviso tom="erro" titulo="Faltam 2 informações.">Confira os campos marcados abaixo.</app-aviso>
 */
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-aviso',
  template: `
    <div>
      @if (titulo()) {
        <!-- O Angular apaga espaços entre elementos; este garante "Título. Texto". -->
        <span class="alert__title">{{ titulo() }}</span>{{ ' ' }}
      }
      <ng-content />
    </div>
  `,
  host: {
    class: 'alert',
    '[class.alert--error]': 'tom() === "erro"',
    '[class.alert--success]': 'tom() === "sucesso"',
    '[attr.role]': 'tom() === "erro" ? "alert" : "status"',
  },
})
export class Aviso {
  readonly tom = input<'informacao' | 'erro' | 'sucesso'>('informacao');
  readonly titulo = input<string>();
}
