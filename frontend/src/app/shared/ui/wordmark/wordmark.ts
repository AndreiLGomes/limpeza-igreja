/** <app-wordmark>: o logo do app, que é só o nome em Verdana negrito (Wordmark). */
import { booleanAttribute, Component, input } from '@angular/core';
import { APP_NAME } from '@core/app-name';

@Component({
  selector: 'app-wordmark',
  template: '{{ nome }}',
  host: {
    class: 'wordmark',
    '[class.wordmark--sm]': 'size() === "sm"',
    '[class.wordmark--md]': 'size() === "md"',
    '[class.wordmark--lg]': 'size() === "lg"',
    '[class.wordmark--on-header]': 'onHeader()',
  },
})
export class Wordmark {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Sobre a barra azul (header): texto branco. */
  readonly onHeader = input(false, { transform: booleanAttribute });

  protected readonly nome = APP_NAME;
}
