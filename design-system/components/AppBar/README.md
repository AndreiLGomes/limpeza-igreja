# AppBar

Barra no topo de todas as telas, no azul-marinho de identidade (`header`), com o nome do app e as abas principais.

## Estrutura

```html
<header class="appbar">
  <h1 class="appbar__title">Limpeza na Sexta</h1>
  <nav class="appbar__nav" aria-label="Principal">
    <a class="appbar__link" aria-current="page" href="/">Esta semana</a>
    <a class="appbar__link" href="/escala">Escala</a>
  </nav>
</header>
```

- A aba atual leva `aria-current="page"` e ganha um sublinhado.
- No máximo 3 ou 4 abas; com mais que isso, use um menu.
- No celular (até 599px), o nome fica em cima e as abas descem para uma linha que rola de lado.
- O nome na barra é o logo: use o estilo do **Wordmark** (`wordmark--sm wordmark--on-header`).

## Angular

Use `routerLink` e `routerLinkActive` com `ariaCurrentWhenActive="page"`, que preenchem o `aria-current` sozinhos.
