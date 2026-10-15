/**
 * <app-avatar name="Andrei Gomes" />: círculo com as iniciais. Sem nome = vaga livre (tracejado, "+").
 * <app-avatar-stack [names]="nomes" [total]="vagas" />: quem vem, completando com vagas livres.
 */
import { Component, computed, input } from '@angular/core';
import { iniciais } from '@limpeza/shared';

@Component({
  selector: 'app-avatar',
  template: '{{ texto() }}',
  host: {
    class: 'avatar',
    role: 'img',
    '[class.avatar--sm]': 'size() === "sm"',
    '[class.avatar--empty]': '!name()',
    '[attr.aria-label]': 'name() || "Vaga livre"',
  },
})
export class Avatar {
  readonly name = input<string>();
  readonly size = input<'md' | 'sm'>('md');

  protected readonly texto = computed(() => {
    const nome = this.name();
    return nome ? iniciais(nome) : '+';
  });
}

@Component({
  selector: 'app-avatar-stack',
  imports: [Avatar],
  template: `
    @for (nome of names(); track $index) {
      <app-avatar [name]="nome" />
    }
    @for (livre of livres(); track $index) {
      <app-avatar />
    }
  `,
  host: {
    class: 'avatar-stack',
    role: 'img',
    '[attr.aria-label]': 'descricao()',
  },
})
export class AvatarStack {
  readonly names = input.required<string[]>();
  readonly total = input.required<number>();

  protected readonly livres = computed(() => Array.from({ length: Math.max(0, this.total() - this.names().length) }));

  protected readonly descricao = computed(() => {
    const confirmados = this.names().length;
    const livres = this.livres().length;
    const textoConfirmados = confirmados === 1 ? '1 confirmado' : `${confirmados} confirmados`;
    const textoLivres = livres === 1 ? '1 vaga livre' : `${livres} vagas livres`;
    return `${textoConfirmados}, ${textoLivres}`;
  });
}
