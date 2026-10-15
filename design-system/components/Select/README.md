# Select

Lista de opções fechada (ex.: qual sexta), com o mesmo visual do TextField e uma setinha própria.

```html
<label class="field">
  <span class="field__label">Qual sexta?</span>
  <span class="select">
    <select class="field__input">...</select>
  </span>
</label>
```

## Regras

- Use quando houver 5 ou mais opções. Com 2 a 4, prefira **ChoiceGroup**, que mostra tudo de uma vez.
- Erro funciona igual ao TextField: `field--error` no `label`.

## Angular

Componente `Select`, importado de `@ui`. Vai dentro de um `app-field`, que liga o rótulo e mostra o erro.

```ts
sextas: Option[] = [
  { value: '2026-10-16', label: 'Sexta, 16 de outubro' },
  { value: '2026-10-23', label: 'Sexta, 23 de outubro' },
];
```

```html
<app-field label="Qual sexta?" [required]="true" [control]="form.controls.data">
  <app-select [options]="sextas" formControlName="data" placeholder="Escolha uma sexta" />
</app-field>
```
