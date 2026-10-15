/**
 * <app-icon name="calendar" />: ícone do Design System (Lucide), na cor do texto ao lado.
 * Sem `label` é decorativo (aria-hidden); com `label`, o leitor de tela anuncia o texto.
 * O SVG vem dos arquivos do próprio Design System (única exceção aceita ao innerHTML, docs/05).
 */
import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONES, type IconName } from './icons.generated';

@Component({
  selector: 'app-icon',
  template: '',
  host: {
    '[innerHTML]': 'svg()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>();
  /** Em px: 20 dentro de botões (padrão) e 24 sozinho. */
  readonly size = input(20);
  readonly label = input<string>();

  protected readonly svg = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${this.size()}" height="${this.size()}" ` +
        `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
        `aria-hidden="true" focusable="false">${ICONES[this.name()]}</svg>`,
    ),
  );
}
