/**
 * <app-app-bar>: barra superior azul com o nome do app (logo) e as abas.
 * A aba atual ganha aria-current="page" sozinha (routerLinkActive). Na área do organizador,
 * aparece a etiqueta "Organizador" ao lado do nome.
 */
import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_NAME } from '@core/app-name';
import { Icon } from '../icon/icon';

export interface LinkDaBarra {
  rotulo: string;
  rota: string;
}

@Component({
  selector: 'app-app-bar',
  imports: [Icon, RouterLink, RouterLinkActive],
  template: `
    <header class="appbar">
      <a class="appbar__title wordmark wordmark--on-header" [routerLink]="home()">
        {{ nome }}
        @if (tag()) {
          <span class="appbar__tag"><app-icon name="lock" [size]="12" /> {{ tag() }}</span>
        }
      </a>
      <nav class="appbar__nav" [attr.aria-label]="tag() ? 'Organização' : 'Principal'">
        @for (link of links(); track link.rota) {
          <a
            class="appbar__link"
            [routerLink]="link.rota"
            routerLinkActive
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            {{ link.rotulo }}
          </a>
        }
      </nav>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
    .appbar__title {
      text-decoration: none;
    }
  `,
})
export class AppBar {
  readonly links = input.required<LinkDaBarra[]>();
  /** Para onde o nome do app leva. */
  readonly home = input('/');
  /** Etiqueta ao lado do nome, ex.: "Organizador". */
  readonly tag = input<string>();

  protected readonly nome = APP_NAME;
}
