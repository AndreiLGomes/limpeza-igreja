# Stepper

Campo de número com botões de − e +, para números pequenos como a quantidade de vagas.

```html
<div class="field">
  <label class="field__label" for="vagas">Vagas</label>
  <div class="stepper">
    <button class="btn btn--ghost btn--icon" aria-label="Menos uma vaga">−</button>
    <input class="stepper__value" id="vagas" type="number" inputmode="numeric" min="1" max="30">
    <button class="btn btn--ghost btn--icon" aria-label="Mais uma vaga">+</button>
  </div>
</div>
```

## Regras

- Para números de 1 a 30. Acima disso, use um TextField com `type="number"`.
- Dá para digitar no meio, além de tocar nos botões.
- No limite (mínimo ou máximo), desabilite o botão correspondente.

## Angular

Na atualização do projeto vira `app-stepper`, ligado ao formulário:

```html
<app-field label="Vagas" hint="Quantas pessoas são necessárias.">
  <app-stepper formControlName="vagas" [min]="1" [max]="30" />
</app-field>
```
