/**
 * Tema claro/escuro (docs/06). Aplica data-theme e color-scheme no <html> e lembra a escolha.
 * Na primeira visita segue o aparelho (prefers-color-scheme).
 */
import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { gravar, ler } from './armazenamento';

export type Tema = 'light' | 'dark';

const CHAVE = 'tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly documento = inject(DOCUMENT);

  readonly theme = signal<Tema>(this.temaInicial());

  constructor() {
    effect(() => {
      const tema = this.theme();
      const html = this.documento.documentElement;
      html.dataset['theme'] = tema;
      // Faz os campos nativos (data, hora, caixa de marcar) acompanharem o tema.
      html.style.colorScheme = tema;
    });
  }

  toggle(): void {
    const novo: Tema = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(novo);
    gravar('local', CHAVE, novo);
  }

  private temaInicial(): Tema {
    const salvo = ler('local', CHAVE);
    if (salvo === 'light' || salvo === 'dark') return salvo;
    const prefereEscuro = this.documento.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefereEscuro ? 'dark' : 'light';
  }
}
