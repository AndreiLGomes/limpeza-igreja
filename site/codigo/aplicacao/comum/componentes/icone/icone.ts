/**
 * <app-icone nome="calendar" />: ícone do Design System (Lucide), na cor do texto ao lado.
 * O `nome` é o nome do arquivo no Design System (ex.: "calendar-check", "trash-2").
 * Sem `rotulo` é decorativo (aria-hidden); com `rotulo`, o leitor de tela anuncia o texto.
 * O SVG vem dos arquivos do próprio Design System (única exceção aceita ao innerHTML, docs/05).
 */
import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONES, type NomeDoIcone } from './icones.gerado';

@Component({
  selector: 'app-icone',
  template: '',
  host: {
    '[innerHTML]': 'svg()',
    '[attr.role]': 'rotulo() ? "img" : null',
    '[attr.aria-label]': 'rotulo() || null',
    '[attr.aria-hidden]': 'rotulo() ? null : "true"',
  },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class Icone {
  private readonly higienizador = inject(DomSanitizer);

  readonly nome = input.required<NomeDoIcone>();
  /** Em px: 20 dentro de botões (padrão) e 24 sozinho. */
  readonly tamanho = input(20);
  readonly rotulo = input<string>();

  protected readonly svg = computed(() =>
    this.higienizador.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${this.tamanho()}" height="${this.tamanho()}" ` +
        `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
        `aria-hidden="true" focusable="false">${ICONES[this.nome()]}</svg>`,
    ),
  );
}
