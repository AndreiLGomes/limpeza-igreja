/**
 * <button appBotao> / <a appBotao>: botão do Design System (Button e IconButton).
 * - variante: primario (padrão), secundario, perigo, discreto, perigo-discreto
 * - larguraToda: ocupa a largura toda
 * - icone: quadrado de 44×44 só com ícone (exige aria-label dizendo a ação e o alvo)
 * - esperando: marca aria-busy enquanto fala com o servidor
 * As classes CSS (btn--primary…) são as do Design System.
 */
import { booleanAttribute, Directive, input } from '@angular/core';

export type VarianteDeBotao = 'primario' | 'secundario' | 'perigo' | 'discreto' | 'perigo-discreto';

@Directive({
  selector: 'button[appBotao], a[appBotao]',
  host: {
    class: 'btn',
    '[class.btn--primary]': 'variante() === "primario"',
    '[class.btn--secondary]': 'variante() === "secundario"',
    '[class.btn--danger]': 'variante() === "perigo"',
    '[class.btn--ghost]': 'variante() === "discreto"',
    '[class.btn--danger-ghost]': 'variante() === "perigo-discreto"',
    '[class.btn--block]': 'larguraToda()',
    '[class.btn--icon]': 'icone()',
    // Enquanto fala com o servidor: o leitor de tela sabe que o botão está ocupado.
    '[attr.aria-busy]': 'esperando() || null',
  },
})
export class Botao {
  readonly variante = input<VarianteDeBotao>('primario');
  readonly larguraToda = input(false, { transform: booleanAttribute });
  readonly icone = input(false, { transform: booleanAttribute });
  /** Botão esperando o servidor (use junto com [disabled] e o <app-conteudo-do-botao>). */
  readonly esperando = input(false, { transform: booleanAttribute });
}
