/**
 * <app-editor-de-tarefas>: lista de tarefas editável (quem organiza), o TaskEditor do Design System.
 * Cada linha é um campo com botão de remover, e no fim há "Adicionar tarefa", que já põe o cursor
 * na linha nova. Cada linha guarda também o `id` da tarefa que já existe no banco, para manter a
 * marcação de feita ao renomear (S9). Linhas vazias são ignoradas ao salvar (o esquema do
 * compartilhado cuida disso). Remover linha vazia ou nova não pede confirmação; tarefa já salva pede.
 *
 *   <app-editor-de-tarefas legenda="Tarefas" [lista]="formulario.controls.tarefas" />
 */
import { Component, effect, type ElementRef, input, signal, viewChildren } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, type FormArray } from '@angular/forms';
import { Botao } from '../botao/botao';
import { estadoDoControle } from '../campo/estado-do-controle';
import { Icone } from '../icone/icone';
import { Janela } from '../janela/janela';

export type LinhaDeTarefa = FormGroup<{ id: FormControl<string | null>; nome: FormControl<string> }>;

/** Cria uma linha do editor. `id` só para tarefa que já existe no banco. */
export function linhaDeTarefa(nome = '', id: string | null = null): LinhaDeTarefa {
  return new FormGroup({
    id: new FormControl<string | null>(id),
    nome: new FormControl(nome, { nonNullable: true }),
  });
}

@Component({
  selector: 'app-editor-de-tarefas',
  imports: [Botao, Icone, Janela, ReactiveFormsModule],
  template: `
    <fieldset class="choices">
      <legend class="choices__legend">{{ legenda() }}</legend>
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
              appBotao
              variante="perigo-discreto"
              icone
              type="button"
              [attr.aria-label]="'Remover tarefa ' + (linha.controls.nome.value || i + 1)"
              (click)="pedirRemocao(i)"
            >
              <app-icone nome="x" />
            </button>
          </div>
        }
        <button appBotao variante="secundario" class="editlist__add" type="button" (click)="adicionar()">
          <app-icone nome="plus" />
          Adicionar tarefa
        </button>
      </div>
    </fieldset>

    <app-janela titulo="Remover esta tarefa?" [(aberta)]="confirmando">
      <p class="dialog__text">"{{ nomeEmRemocao() }}" sai da lista desta sexta quando você salvar.</p>
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="confirmando.set(false)">
          Manter tarefa
        </button>
        <button appBotao variante="perigo" type="button" (click)="confirmarRemocao()">Remover tarefa</button>
      </div>
    </app-janela>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class EditorDeTarefas {
  readonly legenda = input('Tarefas');
  readonly lista = input.required<FormArray<LinhaDeTarefa>>();

  /** As linhas, acompanhando push/removeAt feitos por código (armadilha 2 do docs/06). */
  protected readonly linhas = estadoDoControle(this.lista, (lista) => [...lista.controls], []);

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
    this.lista().push(linhaDeTarefa());
  }

  protected pedirRemocao(indice: number): void {
    const linha = this.lista().at(indice);
    if (!linha.controls.id.value) {
      this.lista().removeAt(indice);
      return;
    }
    this.indiceEmRemocao = indice;
    this.nomeEmRemocao.set(linha.controls.nome.value);
    this.confirmando.set(true);
  }

  protected confirmarRemocao(): void {
    this.lista().removeAt(this.indiceEmRemocao);
    this.confirmando.set(false);
  }
}
