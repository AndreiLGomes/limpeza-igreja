/**
 * <app-conteudo-do-botao>: o texto de um botão que fala com o servidor (Spinner do Design System).
 * Enquanto espera, mostra o círculo girando e o texto de espera ("Salvando…"); senão, o texto normal.
 *
 *   <button appBotao type="submit" [esperando]="salvando()" [disabled]="salvando()">
 *     <app-conteudo-do-botao [esperando]="salvando()">Confirmar presença</app-conteudo-do-botao>
 *   </button>
 */
import { Component, input } from '@angular/core';
import { Girando } from '../carregando/carregando';

@Component({
  selector: 'app-conteudo-do-botao',
  imports: [Girando],
  template: `
    @if (esperando()) {
      <app-girando /> {{ textoDeEspera() }}
    } @else {
      <ng-content />
    }
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class ConteudoDoBotao {
  readonly esperando = input(false);
  readonly textoDeEspera = input('Salvando…');
}
