# DateField

Campo de data ou de horário que usa o seletor nativo do aparelho (o calendário do Android ou do iPhone).

```html
<label class="field">
  <span class="field__label">Data</span>
  <input class="field__input" type="date">
</label>
<label class="field">
  <span class="field__label">Começa às</span>
  <input class="field__input" type="time">
</label>
```

## Regras

- O formato mostrado ("16/10/2026" ou "10/16/2026", "19:00" ou "7:00 PM") **segue o idioma do navegador ou do celular** de quem usa, não o do app. O valor salvo é sempre o mesmo. Teste num celular em português antes de publicar.

- Use o seletor nativo, não um calendário feito à mão: no celular ele é mais fácil e já vem em português.
- O valor vem no formato `AAAA-MM-DD` (data) e `HH:MM` (hora). Para mostrar, converta para "Sexta, 16 de outubro" e "19h".
- Ao criar uma sexta, avise se a data escolhida não for sexta-feira, mas deixe salvar (pode haver limpeza extra).

## Angular

É o mesmo `app-field` com `appInput`, só mudando o `type`:

```html
<app-field label="Data" [required]="true" [control]="form.controls.data">
  <input appInput type="date" formControlName="data" />
</app-field>
```
