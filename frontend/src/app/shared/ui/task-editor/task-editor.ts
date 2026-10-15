/**
 * <app-task-editor>: lista de tarefas editável (quem organiza). Cada linha é um campo com botão de
 * remover, e no fim há "Adicionar tarefa", que já põe o cursor na linha nova.
 * Cada linha guarda também o `id` da tarefa que já existe no banco, para manter a marcação de
 * feita ao renomear (S9). Linhas vazias são ignoradas ao salvar (o esquema do shared cuida disso).
 * Remover linha vazia ou nova não pede confirmação; remover tarefa já salva pede (Dialog).
 *
 *   <app-task-editor legend="Tarefas" [array]="form.controls.tarefas" />
 */
import { Component, effect, type ElementRef, input, signal, viewChildren } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, type FormArray } from '@angular/forms';
import { Button } from '../button/button';
import { Dialog } from '../dialog/dialog';
import { estadoDoControle } from '../field/estado-do-controle';
import { Icon } from '../icon/icon';

export type LinhaDeTarefa = FormGroup<{ id: FormControl<string | null>; nome: FormControl<string> }>;

/** Cria uma linha do editor. `id` só para tarefa que já existe no banco. */
export function linhaDeTarefa(nome = '', id: string | null = null): LinhaDeTarefa {
  return new FormGroup({
    id: new FormControl<string | null>(id),
    nome: new FormControl(nome, { nonNullable: true }),
  });
}

@Component({
  selector: 'app-task-editor',
  imports: [Button, Dialog, Icon, ReactiveFormsModule],
  template: `
    <fieldset class="choices">
      <legend class="choices__legend">{{ legend() }}</legend>
      <div class="editlist">
        @for (linha of linhas(); track linha; let i = $index) {
          <div class="editlist__row">
            <input
              #campo
              class="field__input"
              placeholder="Ex.: tirar o lixo"
              [formControl]="linha.controls.nome"
              [attr.aria-label]="'Tarefa ' + (i + 1)"
            />
            <button
              appButton
              variant="danger-ghost"
              icon
              type="button"
              [attr.aria-label]="'Remover tarefa ' + (linha.controls.nome.value || i + 1)"
              (click)="pedirRemocao(i)"
            >
              <app-icon name="x" />
            </button>
          </div>
        }
        <button appButton variant="secondary" class="editlist__add" type="button" (click)="adicionar()">
          <app-icon name="plus" />
          Adicionar tarefa
        </button>
      </div>
    </fieldset>

    <app-dialog title="Remover esta tarefa?" [(open)]="confirmando">
      <p class="dialog__text">"{{ nomeEmRemocao() }}" sai da lista desta sexta quando você salvar.</p>
      <div dialogActions>
        <button appButton variant="secondary" type="button" autofocus (click)="confirmando.set(false)">
          Manter tarefa
        </button>
        <button appButton variant="danger" type="button" (click)="confirmarRemocao()">Remover tarefa</button>
      </div>
    </app-dialog>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TaskEditor {
  readonly legend = input('Tarefas');
  readonly array = input.required<FormArray<LinhaDeTarefa>>();

  /** As linhas, acompanhando push/removeAt feitos por código (armadilha 2 do docs/06). */
  protected readonly linhas = estadoDoControle(this.array, (array) => [...array.controls], []);

  protected readonly confirmando = signal(false);
  protected readonly nomeEmRemocao = signal('');
  private indiceEmRemocao = -1;

  private readonly campos = viewChildren<ElementRef<HTMLInputElement>>('campo');
  private focarUltima = false;

  constructor() {
    // Depois de "Adicionar tarefa", o cursor vai para a linha nova assim que ela aparece.
    effect(() => {
      const campos = this.campos();
      if (this.focarUltima && campos.length > 0) {
        this.focarUltima = false;
        campos[campos.length - 1]?.nativeElement.focus();
      }
    });
  }

  adicionar(): void {
    this.focarUltima = true;
    this.array().push(linhaDeTarefa());
  }

  protected pedirRemocao(indice: number): void {
    const linha = this.array().at(indice);
    if (!linha.controls.id.value) {
      this.array().removeAt(indice);
      return;
    }
    this.indiceEmRemocao = indice;
    this.nomeEmRemocao.set(linha.controls.nome.value);
    this.confirmando.set(true);
  }

  protected confirmarRemocao(): void {
    this.array().removeAt(this.indiceEmRemocao);
    this.confirmando.set(false);
  }
}
