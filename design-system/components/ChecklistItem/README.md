# ChecklistItem

Uma tarefa da limpeza com caixa de marcar; quando marcada, o texto fica riscado.

## Estrutura

```html
<label class="check">
  <input type="checkbox">
  <span class="check__text">
    <span class="check__task">Varrer o salão</span><br>
    <span class="check__who">Andrei</span>
  </span>
</label>
```

- O `label` inteiro é clicável, não só a caixinha.
- `check__who` (quem ficou com a tarefa) é opcional.

## Angular

```html
@for (t of tarefas(); track t.id) {
  <label class="check">
    <input type="checkbox" [checked]="t.feita" (change)="alternar(t)">
    <span class="check__text"><span class="check__task">{{ t.nome }}</span></span>
  </label>
}
```
