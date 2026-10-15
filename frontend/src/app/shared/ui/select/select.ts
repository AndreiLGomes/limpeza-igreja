/**
 * <app-select>: lista de opções (5 ou mais) com o visual do TextField. Vai dentro de um app-field.
 *   <app-field label="Qual sexta?"><app-select [options]="sextas" formControlName="dia" /></app-field>
 */
import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Input } from '../field/input';
import { CampoDeFormulario, type Opcao } from '../campo-de-formulario';

@Component({
  selector: 'app-select',
  imports: [Input],
  template: `
    <span class="select">
      <select
        appInput
        [value]="valor() ?? ''"
        [disabled]="desabilitado()"
        (change)="mudar($any($event.target).value || null)"
        (blur)="avisarToque()"
      >
        @if (placeholder()) {
          <option value="" disabled [selected]="!valor()">{{ placeholder() }}</option>
        }
        @for (opcao of options(); track opcao.value) {
          <option [value]="opcao.value" [selected]="opcao.value === valor()">{{ opcao.label }}</option>
        }
      </select>
    </span>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
})
export class Select extends CampoDeFormulario<string> {
  readonly options = input.required<Opcao[]>();
  readonly placeholder = input<string>();
}
