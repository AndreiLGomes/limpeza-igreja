# Button

Botão de ação, com altura mínima de 44px para ser fácil de tocar no celular.

## Variações

| Classe | Quando usar |
| --- | --- |
| `btn btn--primary` | A ação principal da tela. **Só um por tela.** |
| `btn btn--secondary` | Ações de apoio (ver escala, voltar). |
| `btn btn--danger` | Ações que desfazem algo (cancelar presença). Peça confirmação antes. |
| `btn btn--ghost` | Ações discretas, parecidas com link. |
| `btn--block` | Ocupa a largura toda (bom no celular). |

## Regras

- O texto diz o que acontece: "Confirmar presença", não "OK".
- Desabilitado: use o atributo `disabled` (em link, `aria-disabled="true"`).
- O foco do teclado mostra um contorno em `primary`. Não remova.

## Angular

```html
<button class="btn btn--primary" (click)="confirmar()" [disabled]="salvando">Confirmar presença</button>
```
