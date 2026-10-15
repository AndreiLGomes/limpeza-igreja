/**
 * <app-person-list [people]="dia.pessoas" [total]="dia.vagas" (remove)="remover($event)" />
 * Quem confirmou, com telefone (link tel:), tempo e observação. SÓ NA ÁREA DO ORGANIZADOR (LGPD).
 * No fim, as vagas livres com o avatar tracejado.
 */
import { Component, computed, input, output } from '@angular/core';
import { soDigitos, TEXTO_DO_TEMPO, type PessoaCompleta } from '@limpeza/shared';
import { Avatar } from '../avatar/avatar';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-person-list',
  imports: [Avatar, Button, Icon],
  template: `
    <ul class="list">
      @for (pessoa of people(); track pessoa.id) {
        <li class="list__item">
          <app-avatar [name]="pessoa.nome" />
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
              appButton
              variant="danger-ghost"
              icon
              type="button"
              [attr.aria-label]="'Remover ' + pessoa.nome"
              (click)="remove.emit(pessoa)"
            >
              <app-icon name="trash-2" />
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
export class PersonList {
  readonly people = input.required<PessoaCompleta[]>();
  readonly total = input.required<number>();
  readonly remove = output<PessoaCompleta>();

  protected readonly livres = computed(() => Math.max(0, this.total() - this.people().length));

  protected digitos(telefone: string): string {
    return soDigitos(telefone);
  }

  /** "o tempo todo" / "só a primeira hora", em minúscula no meio da frase. */
  protected tempo(pessoa: PessoaCompleta): string {
    const texto = TEXTO_DO_TEMPO[pessoa.tempo];
    return texto.charAt(0).toLocaleLowerCase('pt-BR') + texto.slice(1);
  }
}
