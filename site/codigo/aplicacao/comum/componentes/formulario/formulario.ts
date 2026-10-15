/**
 * Peças do Formulário (Form do Design System): título, aviso, campos e botões, sempre na mesma ordem.
 * Lembrete (armadilha 1 do docs/06): todo <form> precisa de [formGroup], senão a página recarrega.
 *
 *   <form appFormulario [formGroup]="formulario" (ngSubmit)="salvar()">
 *     <app-cabecalho-do-formulario titulo="Confirmar presença" descricao="..." />
 *     <div appLinhaDoFormulario> campos lado a lado </div>
 *     <div appAcoesDoFormulario> botões </div>
 *   </form>
 */
import { Component, Directive, input } from '@angular/core';

@Directive({ selector: 'form[appFormulario]', host: { class: 'form', novalidate: '' } })
export class Formulario {}

@Directive({ selector: '[appLinhaDoFormulario]', host: { class: 'form__row' } })
export class LinhaDoFormulario {}

@Directive({ selector: '[appAcoesDoFormulario]', host: { class: 'form__actions' } })
export class AcoesDoFormulario {}

@Component({
  selector: 'app-cabecalho-do-formulario',
  template: `
    <h2 class="form__title">{{ titulo() }}</h2>
    @if (descricao()) {
      <p class="form__desc">{{ descricao() }}</p>
    }
    <ng-content />
  `,
  host: { class: 'form__head' },
})
export class CabecalhoDoFormulario {
  readonly titulo = input.required<string>();
  readonly descricao = input<string>();
}
