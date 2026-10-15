/**
 * <input appEntrada> / <textarea appEntrada> / <select appEntrada>: o campo dentro de um <app-campo>.
 * Põe a classe do Design System e liga id, aria-describedby e aria-invalid ao app-campo.
 */
import { Directive, inject } from '@angular/core';
import { Campo } from './campo';

@Directive({
  selector: 'input[appEntrada], textarea[appEntrada], select[appEntrada]',
  host: {
    class: 'field__input',
    '[id]': 'campo?.idDoCampo',
    '[attr.aria-describedby]': 'campo?.temDica() ? campo?.idDaDica : null',
    '[attr.aria-invalid]': 'campo?.erro() ? "true" : null',
  },
})
export class Entrada {
  protected readonly campo = inject(Campo, { optional: true });
}
