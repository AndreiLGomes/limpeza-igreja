# PersonList

Lista de quem confirmou presença numa sexta, com telefone, tempo e observação. **Aparece só na área de quem organiza.**

```html
<ul class="list">
  <li class="list__item">
    <span class="avatar">AG</span>
    <div class="list__main">
      <span class="list__title">Andrei Gomes</span>
      <span class="list__sub"><a href="tel:+5547999991234">47 99999-1234</a> · o tempo todo</span>
    </div>
    <div class="list__actions">
      <button class="btn btn--danger-ghost btn--icon" aria-label="Remover Andrei Gomes">…</button>
    </div>
  </li>
</ul>
```

## Regras

- **Privacidade:** telefone é dado pessoal (LGPD). Ele só aparece aqui, nunca na escala que todo mundo vê.
- O telefone é um link `tel:`: no celular, tocar nele já liga.
- Remover alguém pede confirmação (Dialog).
- No fim da lista, mostre as vagas livres com o avatar tracejado.
- Nomes longos são cortados com "…" para não quebrar a linha.

## Angular

```html
<ul class="list">
  @for (p of dia().pessoas; track p.id) {
    <li class="list__item">
      <app-avatar [name]="p.nome" />
      <div class="list__main">
        <span class="list__title">{{ p.nome }}</span>
        <span class="list__sub"><a [href]="'tel:+55' + p.telefoneDigitos">{{ p.telefone }}</a></span>
      </div>
      <div class="list__actions">
        <button appButton variant="danger-ghost" class="btn--icon" [attr.aria-label]="'Remover ' + p.nome" (click)="remover(p)">
          <app-icon name="trash-2" />
        </button>
      </div>
    </li>
  }
</ul>
```
