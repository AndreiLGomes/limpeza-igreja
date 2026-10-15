# TaskEditor

Lista de tarefas que quem organiza pode editar: cada linha é um campo de texto com botão de remover, e no fim há "Adicionar tarefa".

```html
<fieldset class="choices">
  <legend class="choices__legend">Tarefas desta sexta</legend>
  <div class="editlist">
    <div class="editlist__row">
      <input class="field__input" value="Varrer o salão" aria-label="Tarefa 1">
      <button class="btn btn--danger-ghost btn--icon" aria-label="Remover tarefa Varrer o salão">×</button>
    </div>
    <button class="btn btn--secondary editlist__add" type="button">+ Adicionar tarefa</button>
  </div>
</fieldset>
```

## Regras

- Ao tocar em "Adicionar tarefa", crie uma linha vazia e já coloque o cursor nela.
- Remover uma linha vazia não pede confirmação; remover uma tarefa já salva, sim.
- Linhas vazias são ignoradas ao salvar.
- Sugestão: quem organiza pode copiar as tarefas da sexta anterior com um botão "Usar tarefas da última sexta".

## Angular

Com `FormArray`, cada linha é um controle:

```html
<div class="editlist" formArrayName="tarefas">
  @for (t of tarefas.controls; track t; let i = $index) {
    <div class="editlist__row">
      <input appInput [formControlName]="i" [attr.aria-label]="'Tarefa ' + (i + 1)" />
      <button appButton variant="danger-ghost" class="btn--icon" type="button" [attr.aria-label]="'Remover tarefa ' + (i + 1)" (click)="tarefas.removeAt(i)">
        <app-icon name="x" />
      </button>
    </div>
  }
  <button appButton variant="secondary" class="editlist__add" type="button" (click)="adicionar()">Adicionar tarefa</button>
</div>
```
