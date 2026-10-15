/**
 * <app-empty-state>: mensagem no lugar de uma lista vazia. O título diz o que falta; o texto diz o
 * que vai acontecer. Botão (por dentro) só se a pessoa puder resolver. Erro de conexão NÃO é tela vazia.
 */
import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons.generated';

@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  template: `
    <span class="empty__icon"><app-icon [name]="icon()" [size]="24" /></span>
    <h3 class="empty__title">{{ title() }}</h3>
    <p class="empty__text">{{ text() }}</p>
    <ng-content />
  `,
  host: { class: 'empty' },
})
export class EmptyState {
  readonly icon = input<IconName>('calendar');
  readonly title = input.required<string>();
  readonly text = input.required<string>();
}
