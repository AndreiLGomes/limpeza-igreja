# Spinner

Mostra que o app está esperando o servidor: um círculo girando, um bloco "Carregando…" ou linhas cinzas no lugar do conteúdo.

## Quando usar cada um

| Classe | Quando |
| --- | --- |
| `loading` + `spinner--sm` | A tela inteira ou uma lista está carregando |
| `spinner` dentro de `btn` | Depois de clicar em enviar, enquanto salva (desabilite o botão) |
| `skeleton` | Primeira carga de cards: linhas cinzas no formato do conteúdo |
| `spinner` sozinho | Espaços pequenos |

## Regras

- Escreva o que está carregando ("Carregando a escala…"), não só "Aguarde".
- Botão salvando: troque o texto ("Salvando…"), use `disabled` e `aria-busy="true"`, para ninguém clicar duas vezes.
- Se demorar mais de 10 segundos, mostre um erro com opção de tentar de novo.
- Com "reduzir movimento" ligado no aparelho, a animação fica mais lenta.

## Angular

Ainda não existe componente próprio no projeto (entra na próxima atualização). Enquanto isso, use as classes com um `signal` que diz se está carregando:

```ts
readonly carregando = signal(true);
readonly salvando = signal(false);
```

```html
<!-- lista carregando -->
@if (carregando()) {
  <div class="loading" role="status"><span class="spinner spinner--sm" aria-hidden="true"></span> Carregando a escala…</div>
}

<!-- botão salvando -->
<button appButton type="submit" [disabled]="salvando()" [attr.aria-busy]="salvando()">
  @if (salvando()) { <span class="spinner" aria-hidden="true"></span> Salvando… } @else { Confirmar presença }
</button>
```
