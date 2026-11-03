/**
 * <app-rodape>: rodapé de todas as telas (Footer). Troca de tema, link discreto para a área de quem
 * organiza (O7) ou "Sair" (quando já entrou), e o aviso obrigatório de projeto pessoal.
 */
import { booleanAttribute, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicoDeTema } from '@nucleo/tema';
import { Icone } from '../icone/icone';
import { Marca } from '../marca/marca';

@Component({
  selector: 'app-rodape',
  imports: [Icone, Marca, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <app-marca tamanho="pequeno" sobreBarra />
        <ul class="footer__links">
          <li>
            <button class="footer__link" type="button" (click)="servicoDeTema.alternar()">
              @if (servicoDeTema.tema() === 'escuro') {
                <app-icone nome="sun" /> Tema claro
              } @else {
                <app-icone nome="moon" /> Tema escuro
              }
            </button>
          </li>
          <li>
            @if (organizador()) {
              <button class="footer__link" type="button" (click)="sair.emit()">
                <app-icone nome="log-out" /> Sair
              </button>
            } @else {
              <a class="footer__link" routerLink="/organizar"><app-icone nome="lock" /> Área de quem organiza</a>
            }
          </li>
        </ul>
        <p class="footer__note">
          Projeto pessoal para organizar a limpeza da igreja. Não é um aplicativo oficial da Congregação Cristã no Brasil.
        </p>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class Rodape {
  /** Na área de quem organiza: mostra "Sair" no lugar do link de entrada. */
  readonly organizador = input(false, { transform: booleanAttribute });
  readonly sair = output<void>();

  protected readonly servicoDeTema = inject(ServicoDeTema);
}
