/**
 * <app-barra>: barra superior azul com o nome do app (logo) e as abas (AppBar do Design System).
 * A aba atual ganha aria-current="page" sozinha (routerLinkActive). Na área do organizador,
 * aparece a etiqueta "Organizador" ao lado do nome. Como no Design System, o nome é só texto (não é
 * link): a primeira aba já leva ao início, e assim não sobra um alvo de toque menor que 44px.
 */
import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive, type IsActiveMatchOptions } from '@angular/router';
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
      <span class="appbar__title wordmark wordmark--on-header">
        {{ nome }}
        @if (etiqueta()) {
          <span class="appbar__tag"><app-icone nome="lock" [tamanho]="12" /> {{ etiqueta() }}</span>
        }
      </span>
      <nav class="appbar__nav" [attr.aria-label]="etiqueta() ? 'Organização' : 'Principal'">
        @for (aba of abas(); track aba.rota) {
          <a
            class="appbar__link"
            [routerLink]="aba.rota"
            routerLinkActive
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="opcoesDaAbaAtiva"
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
  `,
})
export class Barra {
  readonly abas = input.required<AbaDaBarra[]>();
  /** Etiqueta ao lado do nome, ex.: "Organizador". */
  readonly etiqueta = input<string>();

  protected readonly nome = NOME_DO_APP;

  /** A aba fica marcada pelo caminho, ignorando ?dia=… (ex.: /tarefas?dia=ID marca "Tarefas"). */
  protected readonly opcoesDaAbaAtiva: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
}
