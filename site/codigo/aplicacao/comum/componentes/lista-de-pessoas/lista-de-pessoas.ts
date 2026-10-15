/**
 * <app-lista-de-pessoas [pessoas]="dia.pessoas" [total]="dia.vagas" (remover)="remover($event)" />
 * Quem confirmou, com telefone (link tel:), tempo e observação (PersonList).
 * SÓ NA ÁREA DO ORGANIZADOR (LGPD). No fim, as vagas livres com o avatar tracejado.
 */
import { Component, computed, input, output } from '@angular/core';
import { inicialMinuscula, soDigitos, TEXTO_DO_TEMPO, type PessoaCompleta } from '@limpeza/compartilhado';
import { Avatar } from '../avatar/avatar';
import { Botao } from '../botao/botao';
import { Icone } from '../icone/icone';

@Component({
  selector: 'app-lista-de-pessoas',
  imports: [Avatar, Botao, Icone],
  template: `
    <ul class="list">
      @for (pessoa of pessoas(); track pessoa.id) {
        <li class="list__item">
          <app-avatar [nome]="pessoa.nome" />
          <div class="list__main">
            <span class="list__title">{{ pessoa.nome }}</span>
            <span class="list__sub">
              <a [href]="'tel:+55' + digitos(pessoa.telefone)">{{ pessoa.telefone }}</a>
              · {{ tempo(pessoa) }}
              @if (pessoa.observacao) {
                · "{{ pessoa.observacao }}"
              }
            </span>
          </div>
          <div class="list__actions">
            <button
              appBotao
              variante="perigo-discreto"
              icone
              type="button"
              [attr.aria-label]="'Remover ' + pessoa.nome"
              (click)="remover.emit(pessoa)"
            >
              <app-icone nome="trash-2" />
            </button>
          </div>
        </li>
      }
      @if (livres() > 0) {
        <li class="list__item">
          <app-avatar />
          <div class="list__main">
            <span class="list__title list__title--livre">
              {{ livres() === 1 ? '1 vaga livre' : livres() + ' vagas livres' }}
            </span>
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }
    .list__title--livre {
      color: var(--muted);
      font-weight: normal;
    }
  `,
})
export class ListaDePessoas {
  readonly pessoas = input.required<PessoaCompleta[]>();
  readonly total = input.required<number>();
  readonly remover = output<PessoaCompleta>();

  protected readonly livres = computed(() => Math.max(0, this.total() - this.pessoas().length));

  protected digitos(telefone: string): string {
    return soDigitos(telefone);
  }

  /** "o tempo todo" / "só a primeira hora", em minúscula no meio da frase. */
  protected tempo(pessoa: PessoaCompleta): string {
    return inicialMinuscula(TEXTO_DO_TEMPO[pessoa.tempo]);
  }
}
