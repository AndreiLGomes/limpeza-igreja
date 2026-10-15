/**
 * Tema claro/escuro (docs/06). Aplica data-theme e color-scheme no <html> e lembra a escolha.
 * Na primeira visita segue o aparelho (prefers-color-scheme).
 */
import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { gravar, ler } from './armazenamento';

export type Tema = 'claro' | 'escuro';

const CHAVE = 'tema';

/** Os valores do atributo data-theme são os do Design System (o CSS dele usa "light" e "dark"). */
const VALOR_NO_DESIGN_SYSTEM: Record<Tema, 'light' | 'dark'> = { claro: 'light', escuro: 'dark' };

@Injectable({ providedIn: 'root' })
export class ServicoDeTema {
  private readonly documento = inject(DOCUMENT);

  readonly tema = signal<Tema>(this.temaInicial());

  constructor() {
    effect(() => {
      const valor = VALOR_NO_DESIGN_SYSTEM[this.tema()];
      const html = this.documento.documentElement;
      html.dataset['theme'] = valor;
      // Faz os campos nativos (data, hora, caixa de marcar) acompanharem o tema.
      html.style.colorScheme = valor;
    });
  }

  alternar(): void {
    const novo: Tema = this.tema() === 'escuro' ? 'claro' : 'escuro';
    this.tema.set(novo);
    gravar('local', CHAVE, novo);
  }

  private temaInicial(): Tema {
    const salvo = ler('local', CHAVE);
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
    const prefereEscuro = this.documento.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefereEscuro ? 'escuro' : 'claro';
  }
}
