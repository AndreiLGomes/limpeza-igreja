/**
 * <app-item-de-tarefa tarefa="Varrer o salão" [(feita)]="feita" />: tarefa que dá para marcar como feita
 * (ChecklistItem). O rótulo inteiro é clicável. Nesta versão não há linha de responsável (T6).
 */
import { booleanAttribute, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-item-de-tarefa',
  template: `
    <label class="check">
      <input
        type="checkbox"
        [checked]="feita()"
        [disabled]="desabilitado()"
        (change)="feita.set($any($event.target).checked)"
      />
      <span class="check__text"><span class="check__task">{{ tarefa() }}</span></span>
    </label>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ItemDeTarefa {
  readonly tarefa = input.required<string>();
  readonly feita = model(false);
  readonly desabilitado = input(false, { transform: booleanAttribute });
}
