/**
 * <input appInput> / <textarea appInput> / <select appInput>: o campo dentro de um <app-field>.
 * Põe a classe do Design System e liga id, aria-describedby e aria-invalid ao app-field.
 */
import { Directive, inject } from '@angular/core';
import { Field } from './field';

@Directive({
  selector: 'input[appInput], textarea[appInput], select[appInput]',
  host: {
    class: 'field__input',
    '[id]': 'campo?.idDoCampo',
    '[attr.aria-describedby]': 'campo?.temDica() ? campo?.idDaDica : null',
    '[attr.aria-invalid]': 'campo?.erro() ? "true" : null',
  },
})
export class Input {
  protected readonly campo = inject(Field, { optional: true });
}
