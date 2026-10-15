/**
 * <app-barra>: barra superior azul com o nome do app (logo) e as abas (AppBar do Design System).
 * A aba atual ganha aria-current="page" sozinha (routerLinkActive). Na área do organizador,
 * aparece a etiqueta "Organizador" ao lado do nome.
 */
import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NOME_DO_APP } from '@nucleo/nome-do-app';
import { Icone } from '../icone/icone';

export interface AbaDaBarra {
  rotulo: string;
  rota: string;
}

@Component({
  selector: 'app-barra',
  imports: [Icone, RouterLink, RouterLinkActive],
  template: `
    <header class="appbar">
      <a class="appbar__title wordmark wordmark--on-header" [routerLink]="inicio()">
        {{ nome }}
        @if (etiqueta()) {
          <span class="appbar__tag"><app-icone nome="lock" [tamanho]="12" /> {{ etiqueta() }}</span>
        }
      </a>
      <nav class="appbar__nav" [attr.aria-label]="etiqueta() ? 'Organização' : 'Principal'">
        @for (aba of abas(); track aba.rota) {
          <a
            class="appbar__link"
            [routerLink]="aba.rota"
            routerLinkActive
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            {{ aba.rotulo }}
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
export class Barra {
  readonly abas = input.required<AbaDaBarra[]>();
  /** Para onde o nome do app leva. */
  readonly inicio = input('/');
  /** Etiqueta ao lado do nome, ex.: "Organizador". */
  readonly etiqueta = input<string>();

  protected readonly nome = NOME_DO_APP;
}
