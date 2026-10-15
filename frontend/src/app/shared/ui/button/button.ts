/**
 * <button appButton> / <a appButton>: botão do Design System (Button e IconButton).
 * - variant: primary (padrão), secondary, danger, ghost, danger-ghost
 * - block: ocupa a largura toda
 * - icon: quadrado de 44×44 só com ícone (exige aria-label dizendo a ação e o alvo)
 */
import { booleanAttribute, Directive, input } from '@angular/core';

export type VarianteDeBotao = 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-ghost';

@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    class: 'btn',
    '[class.btn--primary]': 'variant() === "primary"',
    '[class.btn--secondary]': 'variant() === "secondary"',
    '[class.btn--danger]': 'variant() === "danger"',
    '[class.btn--ghost]': 'variant() === "ghost"',
    '[class.btn--danger-ghost]': 'variant() === "danger-ghost"',
    '[class.btn--block]': 'block()',
    '[class.btn--icon]': 'icon()',
  },
})
export class Button {
  readonly variant = input<VarianteDeBotao>('primary');
  readonly block = input(false, { transform: booleanAttribute });
  readonly icon = input(false, { transform: booleanAttribute });
}
