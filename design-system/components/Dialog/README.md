# Dialog

Janela que pede confirmação antes de uma ação que desfaz algo (cancelar presença, apagar uma sexta).

## Estrutura

Use o elemento nativo `<dialog>`, aberto com `showModal()`. Ele já prende o foco dentro da janela e fecha com Esc.

```html
<dialog class="dialog" aria-labelledby="titulo">
  <h2 class="dialog__title" id="titulo">Cancelar sua presença?</h2>
  <p class="dialog__text">Você sai da escala de sexta, 16 de outubro.</p>
  <div class="dialog__actions">
    <button class="btn btn--secondary">Manter presença</button>
    <button class="btn btn--danger">Cancelar presença</button>
  </div>
</dialog>
```

O fundo escurecido usa o token `scrim`; a sombra, `shadow-overlay`.

## Regras

- O título é uma pergunta, e os botões repetem a ação: "Cancelar presença", nunca "Sim" e "Não".
- O botão que **não** faz nada fica à esquerda e recebe o foco ao abrir.
- Só para ações sérias. Para confirmar algo bom, use **Toast**.
- No celular, os botões ocupam a largura toda, com a ação perigosa em cima.

## Angular

Ainda não existe componente próprio no projeto (entra na próxima atualização, como `app-dialog`). Enquanto isso, o `<dialog>` nativo com as classes já funciona:

```ts
readonly janela = viewChild.required<ElementRef<HTMLDialogElement>>('janela');

abrir() { this.janela().nativeElement.showModal(); }
fechar() { this.janela().nativeElement.close(); }
cancelarPresenca() { /* chama o servidor */ this.fechar(); }
```

```html
<button appButton variant="danger" (click)="abrir()">Cancelar presença</button>

<dialog #janela class="dialog" aria-labelledby="titulo-cancelar">
  <h2 class="dialog__title" id="titulo-cancelar">Cancelar sua presença?</h2>
  <p class="dialog__text">Você sai da escala de {{ data }}.</p>
  <div class="dialog__actions">
    <button appButton variant="secondary" (click)="fechar()" autofocus>Manter presença</button>
    <button appButton variant="danger" (click)="cancelarPresenca()">Cancelar presença</button>
  </div>
</dialog>
```
