/**
 * <app-checklist-item task="Varrer o salão" [(done)]="feita" />: tarefa que dá para marcar como feita.
 * O rótulo inteiro é clicável. Nesta versão não há linha de responsável (T6).
 */
import { booleanAttribute, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-checklist-item',
  template: `
    <label class="check">
      <input type="checkbox" [checked]="done()" [disabled]="disabled()" (change)="done.set($any($event.target).checked)" />
      <span class="check__text"><span class="check__task">{{ task() }}</span></span>
    </label>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ChecklistItem {
  readonly task = input.required<string>();
  readonly done = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
}
