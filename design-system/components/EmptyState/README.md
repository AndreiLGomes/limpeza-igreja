# EmptyState

Mensagem amigável no lugar de uma lista vazia: ícone, título, explicação e, se fizer sentido, um botão.

## Estrutura

```html
<div class="empty">
  <span class="empty__icon"><!-- ícone 24px, ex.: calendar --></span>
  <h3 class="empty__title">Nenhuma sexta marcada</h3>
  <p class="empty__text">Quando quem organiza cadastrar as próximas limpezas, elas aparecem aqui.</p>
  <button class="btn btn--secondary">Atualizar</button>
</div>
```

## Regras

- O título diz o que falta; o texto diz o que vai acontecer ou o que fazer.
- Se a pessoa pode resolver, ofereça o botão ("Cadastrar sexta"). Se não pode, não ponha botão.
- Erro de conexão não é tela vazia: mostre o erro e um "Tentar de novo".

## Angular

Ainda não existe componente próprio no projeto (entra na próxima atualização, como `app-empty-state`). Enquanto isso, use as classes com `@if` / `@else`:

```html
@if (dias().length === 0) {
  <div class="empty">
    <span class="empty__icon"><app-icon name="calendar" /></span>
    <h3 class="empty__title">Nenhuma sexta marcada</h3>
    <p class="empty__text">Quando quem organiza cadastrar as próximas limpezas, elas aparecem aqui.</p>
    <button appButton variant="secondary" (click)="recarregar()">Atualizar</button>
  </div>
} @else {
  @for (dia of dias(); track dia.data) { <app-dia-card [dia]="dia" /> }
}
```
