# Card

Caixa que agrupa as informações de um item, como um dia de limpeza: título, detalhes, quem vem e ações.

## Estrutura

```html
<article class="card">
  <div class="card__head">
    <div>
      <h3 class="card__title">Sexta, 16 de outubro</h3>
      <p class="card__meta">19h às 21h · 3 de 5 vagas</p>
    </div>
    <span class="status status--pending">Faltam 2</span>
  </div>
  <!-- conteúdo livre: avatares, lista de tarefas... -->
  <div class="card__actions">...</div>
</article>
```

## Regras

- Coloque os cards sobre fundo `surface-alt`, para eles se destacarem.
- No máximo um `btn--primary` por card.
- `card__meta` usa `muted`: só fica legível sobre o próprio card (fundo `bg`).

## Angular

Componente `Card`, importado de `@ui`. Tem dois encaixes: `cardStatus` (canto de cima) e `cardActions` (botões no fim); o resto vai no meio.

```html
<app-card title="Sexta, 16 de outubro" meta="19h às 21h · 3 de 5 vagas">
  <app-status-badge cardStatus tone="pending">Faltam 2</app-status-badge>
  <app-avatar-stack [names]="dia.confirmados" [total]="dia.vagas" />
  <div cardActions>
    <a appButton routerLink="/confirmar">Confirmar presença</a>
    <a appButton variant="ghost" routerLink="/tarefas">Ver tarefas</a>
  </div>
</app-card>
```
