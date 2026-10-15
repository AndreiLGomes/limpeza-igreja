# Form

Estrutura padrão de todos os formulários do app: título, descrição, aviso, campos e botões, sempre na mesma ordem e com o mesmo espaçamento.

## Peças

| Classe | O que é |
| --- | --- |
| `form` | O formulário inteiro (largura máxima de 560px, 24px entre blocos) |
| `form__head`, `form__title`, `form__desc` | Título e explicação curta |
| `alert` (`--error`, `--success`) | Aviso no topo: resumo dos erros ou confirmação de envio |
| `form__row` | Coloca 2 campos lado a lado; no celular, um embaixo do outro |
| `form__required` | O asterisco vermelho de campo obrigatório |
| `form__actions` | Linha de botões no fim, alinhada à direita |

Dentro dele vão os outros componentes: **TextField**, **Select**, **ChoiceGroup** e **ChecklistItem**.

## Regras

- Botão principal sempre à direita, e só um. "Cancelar" fica à esquerda, como `btn--ghost`.
- Ao enviar com erro, mostre o `alert--error` no topo **e** a mensagem embaixo de cada campo errado.
- Valide quando a pessoa sai do campo ou envia, não a cada letra digitada.

## Angular (reaproveitando)

Crie um componente `app-field` que já monta rótulo, dica e erro, e use-o em todos os formulários:

```html
<form class="form" [formGroup]="form" (ngSubmit)="salvar()">
  <div class="form__head"><h2 class="form__title">Confirmar presença</h2></div>
  <app-field label="Seu nome" [required]="true" [control]="form.controls.nome" />
  <app-field label="Telefone" hint="Com DDD" [control]="form.controls.telefone" />
  <div class="form__actions">
    <button type="submit" class="btn btn--primary">Confirmar presença</button>
  </div>
</form>
```
