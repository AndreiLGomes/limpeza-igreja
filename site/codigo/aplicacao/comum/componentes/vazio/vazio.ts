/**
 * <app-vazio>: mensagem no lugar de uma lista vazia (EmptyState). O título diz o que falta; o texto
 * diz o que vai acontecer. Botão (por dentro) só se a pessoa puder resolver. Erro de conexão NÃO é tela vazia.
 */
import { Component, input } from '@angular/core';
import { Icone } from '../icone/icone';
import type { NomeDoIcone } from '../icone/icones.gerado';

@Component({
  selector: 'app-vazio',
  imports: [Icone],
  template: `
    <span class="empty__icon"><app-icone [nome]="icone()" [tamanho]="24" /></span>
    <h3 class="empty__title">{{ titulo() }}</h3>
    <p class="empty__text">{{ texto() }}</p>
    <ng-content />
  `,
  host: { class: 'empty' },
})
export class Vazio {
  readonly icone = input<NomeDoIcone>('calendar');
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
}
