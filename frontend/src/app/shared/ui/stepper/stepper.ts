/**
 * <app-stepper>: número pequeno com − e + (ex.: vagas, de 1 a 30). Dá para digitar no meio.
 * No limite, o botão correspondente fica desabilitado. Vai dentro de um app-field.
 *   <app-field label="Vagas"><app-stepper formControlName="vagas" [min]="1" [max]="30" unit="vagas" /></app-field>
 */
import { Component, forwardRef, inject, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Button } from '../button/button';
import { Field } from '../field/field';
import { Icon } from '../icon/icon';
import { CampoDeFormulario } from '../campo-de-formulario';

@Component({
  selector: 'app-stepper',
  imports: [Button, Icon],
  template: `
    <div class="stepper">
      <button
        appButton
        variant="ghost"
        icon
        type="button"
        [attr.aria-label]="'Diminuir ' + unit()"
        [disabled]="desabilitado() || (valor() ?? min()) <= min()"
        (click)="somar(-1)"
      >
        <app-icon name="minus" />
      </button>
      <input
        class="stepper__value"
        type="number"
        inputmode="numeric"
        [id]="campo?.idDoCampo"
        [attr.aria-describedby]="campo?.temDica() ? campo.idDaDica : null"
        [attr.aria-invalid]="campo?.erro() ? 'true' : null"
        [min]="min()"
        [max]="max()"
        [value]="valor() ?? ''"
        [disabled]="desabilitado()"
        (input)="digitar($any($event.target).value)"
        (blur)="avisarToque()"
      />
      <button
        appButton
        variant="ghost"
        icon
        type="button"
        [attr.aria-label]="'Aumentar ' + unit()"
        [disabled]="desabilitado() || (valor() ?? max()) >= max()"
        (click)="somar(1)"
      >
        <app-icon name="plus" />
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Stepper), multi: true }],
})
export class Stepper extends CampoDeFormulario<number> {
  readonly min = input(0);
  readonly max = input(Number.MAX_SAFE_INTEGER);
  /** Para os botões, no plural: "Diminuir vagas" / "Aumentar vagas". */
  readonly unit = input.required<string>();

  protected readonly campo = inject(Field, { optional: true });

  protected somar(quanto: number): void {
    const atual = this.valor() ?? this.min();
    this.mudar(Math.min(this.max(), Math.max(this.min(), atual + quanto)));
    this.avisarToque();
  }

  protected digitar(texto: string): void {
    // Campo vazio vira null, para a validação dizer que falta o número.
    this.mudar(texto === '' ? null : Number(texto));
  }
}
