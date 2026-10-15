/**
 * <app-choice-group>: opções grandes para escolher uma (radio) ou várias (checkbox), de 2 a 4.
 *   <app-choice-group legend="Quanto tempo você pode ficar?" [options]="tempos" [row]="true" formControlName="tempo" />
 * Com [multiple]="true", o valor vira uma lista.
 */
import { booleanAttribute, Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CampoDeFormulario, type Opcao } from '../campo-de-formulario';

let proximoGrupo = 0;

@Component({
  selector: 'app-choice-group',
  template: `
    <fieldset class="choices" [class.choices--row]="row()">
      <legend class="choices__legend">{{ legend() }}</legend>
      @for (opcao of options(); track opcao.value) {
        <label class="choice">
          <input
            [type]="multiple() ? 'checkbox' : 'radio'"
            [name]="nome"
            [value]="opcao.value"
            [checked]="marcada(opcao.value)"
            [disabled]="desabilitado()"
            (change)="alternar(opcao.value)"
            (blur)="avisarToque()"
          />
          {{ opcao.label }}
        </label>
      }
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ChoiceGroup), multi: true }],
})
export class ChoiceGroup extends CampoDeFormulario<string | string[]> {
  readonly legend = input.required<string>();
  readonly options = input.required<Opcao[]>();
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Opções lado a lado. */
  readonly row = input(false, { transform: booleanAttribute });

  protected readonly nome = `escolha-${++proximoGrupo}`;

  protected marcada(valor: string): boolean {
    const atual = this.valor();
    return Array.isArray(atual) ? atual.includes(valor) : atual === valor;
  }

  protected alternar(valor: string): void {
    if (!this.multiple()) {
      this.mudar(valor);
      return;
    }
    const atual = Array.isArray(this.valor()) ? (this.valor() as string[]) : [];
    this.mudar(atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]);
  }
}
