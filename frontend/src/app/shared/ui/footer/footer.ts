/**
 * <app-footer>: rodapé de todas as telas. Troca de tema, link discreto para a área de quem organiza
 * (O7) ou "Sair" (quando já entrou), e o aviso obrigatório de projeto pessoal.
 */
import { booleanAttribute, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@core/theme';
import { Icon } from '../icon/icon';
import { Wordmark } from '../wordmark/wordmark';

@Component({
  selector: 'app-footer',
  imports: [Icon, RouterLink, Wordmark],
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <app-wordmark size="sm" onHeader />
        <ul class="footer__links">
          <li>
            <button class="footer__link" type="button" (click)="tema.toggle()">
              @if (tema.theme() === 'dark') {
                <app-icon name="sun" /> Tema claro
              } @else {
                <app-icon name="moon" /> Tema escuro
              }
            </button>
          </li>
          <li>
            @if (organizer()) {
              <button class="footer__link" type="button" (click)="logout.emit()">
                <app-icon name="log-out" /> Sair
              </button>
            } @else {
              <a class="footer__link" routerLink="/organizar"><app-icon name="lock" /> Área de quem organiza</a>
            }
          </li>
        </ul>
        <p class="footer__note">
          Projeto pessoal para organizar a limpeza de sexta. Não é um aplicativo oficial da Congregação Cristã no Brasil.
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
export class Footer {
  /** Na área de quem organiza: mostra "Sair" no lugar do link de entrada. */
  readonly organizer = input(false, { transform: booleanAttribute });
  readonly logout = output<void>();

  protected readonly tema = inject(ThemeService);
}
