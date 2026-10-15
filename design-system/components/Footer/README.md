# Footer

Rodapé no fim de todas as telas públicas, com a troca de tema, o link discreto para a área de quem organiza e o aviso de que o app não é oficial.

## Estrutura

```html
<footer class="footer">
  <div class="footer__inner">
    <span class="wordmark wordmark--sm wordmark--on-header">Escala de Limpeza</span>
    <ul class="footer__links">
      <li><button class="footer__link" type="button">Tema escuro</button></li>
      <li><a class="footer__link" href="/organizar">Área de quem organiza</a></li>
    </ul>
    <p class="footer__note">Projeto pessoal para organizar a limpeza de sexta. Não é um aplicativo oficial da Congregação Cristã no Brasil.</p>
  </div>
</footer>
```

## Regras

- Usa as mesmas cores da barra superior (`header` e `on-header`).
- Os links são sublinhados, porque no rodapé não há outro sinal de que são clicáveis. Cada um tem pelo menos 44px de altura para o toque.
- **O aviso de projeto pessoal é obrigatório.** As cores lembram as da igreja, então o aviso deixa claro que o app não é oficial.
- Na área de quem organiza, o rodapé troca "Área de quem organiza" por "Sair".
- A troca de tema fica aqui, e não na barra superior, para a barra ter só as abas.

## Angular

Na atualização do projeto vira `app-footer`, colocado uma vez no `app.html`, depois do `<router-outlet />`:

```html
<main><router-outlet /></main>
<app-footer />
```

O botão de tema usa o `ThemeService` que já existe (`theme.toggle()`).
