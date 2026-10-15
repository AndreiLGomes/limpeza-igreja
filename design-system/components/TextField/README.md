# TextField

Campo de texto com rótulo sempre visível em cima, dica opcional embaixo e estado de erro.

## Estrutura

```html
<label class="field">
  <span class="field__label">Seu nome</span>
  <input class="field__input" placeholder="Ex.: Andrei Gomes">
  <span class="field__hint">Aparece para quem vê a escala.</span>
</label>
```

- Erro: adicione `field--error` no `label` e `aria-invalid="true"` no `input`. A dica vira a mensagem de erro, em `danger`.
- Texto longo: troque `input` por `textarea class="field__input"`.

## Regras

- Nunca use o placeholder no lugar do rótulo: ele some quando a pessoa digita.
- A mensagem de erro diz como corrigir ("Digite o número com DDD"), não só "Inválido".

## Angular

```html
<label class="field" [class.field--error]="nome.invalid && nome.touched">
  <span class="field__label">Seu nome</span>
  <input class="field__input" [formControl]="nome">
</label>
```
