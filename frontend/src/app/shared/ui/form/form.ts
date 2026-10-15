/**
 * Peças do Form: estrutura padrão de todo formulário (título, aviso, campos e botões).
 * Lembrete (armadilha 1 do docs/06): todo <form> precisa de [formGroup], senão a página recarrega.
 *
 *   <form appForm [formGroup]="form" (ngSubmit)="salvar()">
 *     <app-form-header title="Confirmar presença" desc="..." />
 *     <div appFormRow> campos lado a lado </div>
 *     <div appFormActions> botões </div>
 *   </form>
 */
import { Component, Directive, input } from '@angular/core';

@Directive({ selector: 'form[appForm]', host: { class: 'form', novalidate: '' } })
export class FormDirective {}

@Directive({ selector: '[appFormRow]', host: { class: 'form__row' } })
export class FormRow {}

@Directive({ selector: '[appFormActions]', host: { class: 'form__actions' } })
export class FormActions {}

@Component({
  selector: 'app-form-header',
  template: `
    <h2 class="form__title">{{ title() }}</h2>
    @if (desc()) {
      <p class="form__desc">{{ desc() }}</p>
    }
    <ng-content />
  `,
  host: { class: 'form__head' },
})
export class FormHeader {
  readonly title = input.required<string>();
  readonly desc = input<string>();
}
