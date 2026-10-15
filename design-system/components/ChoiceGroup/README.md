# ChoiceGroup

Opções grandes e fáceis de tocar, para escolher uma (radio) ou várias (checkbox) entre poucas.

```html
<fieldset class="choices choices--row">
  <legend class="choices__legend">Quanto tempo você pode ficar?</legend>
  <label class="choice"><input type="radio" name="tempo"> O tempo todo</label>
  <label class="choice"><input type="radio" name="tempo"> Só a primeira hora</label>
</fieldset>
```

- `choices--row`: opções lado a lado. Sem ela, uma embaixo da outra.
- `type="radio"` para escolher uma; `type="checkbox"` para várias.
- A opção marcada ganha borda em `primary`.

## Regras

- Use para 2 a 4 opções. Com mais, prefira **Select**.
- Sempre com `fieldset` + `legend`, para o leitor de tela anunciar a pergunta.

## Angular

Componente `ChoiceGroup`, importado de `@ui`. Funciona com formulários reativos (`formControlName` ou `[formControl]`).

```ts
tempos: Option[] = [
  { value: 'todo', label: 'O tempo todo' },
  { value: 'primeira-hora', label: 'Só a primeira hora' },
];
```

```html
<!-- uma opção (radio) -->
<app-choice-group legend="Quanto tempo você pode ficar?" [options]="tempos" [row]="true" formControlName="tempo" />

<!-- várias opções (checkbox): o valor vira uma lista -->
<app-choice-group legend="O que você prefere fazer?" [options]="tarefas" [multiple]="true" formControlName="preferencias" />
```
