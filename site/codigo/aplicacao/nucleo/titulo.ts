/** Título da aba: "<Tela> · <nome do app>" (docs/06). */
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, type RouterStateSnapshot } from '@angular/router';
import { NOME_DO_APP } from './nome-do-app';

@Injectable({ providedIn: 'root' })
export class TituloDaAba extends TitleStrategy {
  private readonly titulo = inject(Title);

  override updateTitle(estado: RouterStateSnapshot): void {
    const tela = this.buildTitle(estado);
    this.titulo.setTitle(tela ? `${tela} · ${NOME_DO_APP}` : NOME_DO_APP);
  }
}
