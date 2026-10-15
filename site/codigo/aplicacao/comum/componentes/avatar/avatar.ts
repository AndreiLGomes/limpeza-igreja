/**
 * <app-avatar nome="Andrei Gomes" />: círculo com as iniciais. Sem nome = vaga livre (tracejado, "+").
 * <app-grupo-de-avatares [nomes]="nomes" [total]="vagas" />: quem vem, completando com vagas livres.
 */
import { Component, computed, input } from '@angular/core';
import { iniciais } from '@limpeza/compartilhado';

@Component({
  selector: 'app-avatar',
  template: '{{ texto() }}',
  host: {
    class: 'avatar',
    role: 'img',
    '[class.avatar--sm]': 'tamanho() === "pequeno"',
    '[class.avatar--empty]': '!nome()',
    '[attr.aria-label]': 'nome() || "Vaga livre"',
  },
})
export class Avatar {
  readonly nome = input<string>();
  readonly tamanho = input<'normal' | 'pequeno'>('normal');

  protected readonly texto = computed(() => {
    const nome = this.nome();
    return nome ? iniciais(nome) : '+';
  });
}

@Component({
  selector: 'app-grupo-de-avatares',
  imports: [Avatar],
  template: `
    @for (nome of nomes(); track $index) {
      <app-avatar [nome]="nome" />
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
export class GrupoDeAvatares {
  readonly nomes = input.required<string[]>();
  readonly total = input.required<number>();

  protected readonly livres = computed(() => Array.from({ length: Math.max(0, this.total() - this.nomes().length) }));

  protected readonly descricao = computed(() => {
    const confirmados = this.nomes().length;
    const livres = this.livres().length;
    const textoConfirmados = confirmados === 1 ? '1 confirmado' : `${confirmados} confirmados`;
    const textoLivres = livres === 1 ? '1 vaga livre' : `${livres} vagas livres`;
    return `${textoConfirmados}, ${textoLivres}`;
  });
}
