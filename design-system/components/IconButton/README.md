# IconButton

Botão quadrado só com ícone (44×44px), para ações que se repetem em cada linha de uma lista: editar, remover, adicionar.

## Classes

| Classe | Quando |
| --- | --- |
| `btn btn--ghost btn--icon` | Ação neutra (editar) |
| `btn btn--danger-ghost btn--icon` | Ação que remove algo |
| `btn btn--secondary btn--icon` | Ação de adicionar, com borda |
| `btn btn--primary` + ícone + texto | Botão normal com ícone à esquerda ("Nova sexta") |

`btn--danger-ghost` também funciona com texto ("Apagar sexta"), para ações perigosas que não são a principal da tela.

## Regras

- **Sempre** coloque `aria-label` dizendo a ação e o alvo: "Remover Andrei Gomes", não só "Remover".
- Fora de listas, prefira botão com texto: o ícone sozinho é fácil de não entender.
- Ícones de 20px, da biblioteca do sistema (veja Ícones).
- Remover sempre pede confirmação antes (veja Dialog).

## Angular

```html
<button appButton variant="ghost" class="btn--icon" [attr.aria-label]="'Editar ' + titulo">
  <app-icon name="pencil" />
</button>
```

Na atualização do projeto, o `appButton` ganha a opção `icon` (para não precisar da classe extra) e a variante `danger-ghost`, que hoje ainda não existe no código Angular.
