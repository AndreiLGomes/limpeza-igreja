import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AreaDeNotificacoes } from '@componentes';
import { ServicoDeTema } from '@nucleo/tema';

@Component({
  selector: 'app-raiz',
  imports: [AreaDeNotificacoes, RouterOutlet],
  template: `
    <router-outlet />
    <app-area-de-notificacoes />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
  `,
})
export class Aplicacao {
  // Cria o ServicoDeTema logo na abertura, para aplicar o tema antes da primeira tela.
  protected readonly servicoDeTema = inject(ServicoDeTema);
}
