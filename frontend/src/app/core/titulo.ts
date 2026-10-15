/** Título da aba: "<Tela> · <nome do app>" (docs/06). */
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, type RouterStateSnapshot } from '@angular/router';
import { APP_NAME } from './app-name';

@Injectable({ providedIn: 'root' })
export class TituloDaAba extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(estado: RouterStateSnapshot): void {
    const tela = this.buildTitle(estado);
    this.title.setTitle(tela ? `${tela} · ${APP_NAME}` : APP_NAME);
  }
}
