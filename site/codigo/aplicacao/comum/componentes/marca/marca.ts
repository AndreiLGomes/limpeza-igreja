/** <app-marca>: o logo do app, que é só o nome em Verdana negrito (Wordmark do Design System). */
import { booleanAttribute, Component, input } from '@angular/core';
import { NOME_DO_APP } from '@nucleo/nome-do-app';

@Component({
  selector: 'app-marca',
  template: '{{ nome }}',
  host: {
    class: 'wordmark',
    '[class.wordmark--sm]': 'tamanho() === "pequeno"',
    '[class.wordmark--md]': 'tamanho() === "medio"',
    '[class.wordmark--lg]': 'tamanho() === "grande"',
    '[class.wordmark--on-header]': 'sobreBarra()',
  },
})
export class Marca {
  readonly tamanho = input<'pequeno' | 'medio' | 'grande'>('medio');
  /** Sobre a barra azul (header): texto branco. */
  readonly sobreBarra = input(false, { transform: booleanAttribute });

  protected readonly nome = NOME_DO_APP;
}
