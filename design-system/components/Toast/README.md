# Toast

Mensagem curta que aparece no rodapé da tela depois de uma ação ("Presença confirmada") e some sozinha.

## Estrutura

```html
<div class="toast-area">
  <div class="toast" role="status">
    <span class="toast__text">Presença cancelada.</span>
    <button class="btn btn--ghost">Desfazer</button>
  </div>
</div>
```

- `toast-area` fica uma vez só no app; os toasts entram dentro dela.
- Sucesso e aviso: `role="status"`. Erro: `role="alert"`.

## Regras

- Some depois de 5 segundos. Com botão de ação ("Desfazer", "Tentar de novo"), espere 8 segundos.
- No máximo uma frase. A frase diz o que aconteceu, e a cor não muda: o texto é que informa.
- Erro de formulário **não** vai em toast: vai no **Alert** do formulário, que não some.

## Angular

Ainda não existe no projeto (entra na próxima atualização). O plano é um serviço único, `ToastService`, para qualquer tela mostrar uma mensagem com uma linha só, e a `toast-area` fica uma vez no `app.html`:

```ts
// em qualquer tela
private readonly toast = inject(ToastService);

confirmar() {
  this.toast.show('Presença confirmada para sexta, 16 de outubro.');
}
cancelar() {
  this.toast.show('Presença cancelada.', { action: 'Desfazer', onAction: () => this.desfazer() });
}
```

```html
<!-- app.html: uma vez só -->
<div class="toast-area">
  @for (t of toast.lista(); track t.id) {
    <div class="toast" [attr.role]="t.erro ? 'alert' : 'status'">
      <span class="toast__text">{{ t.texto }}</span>
      @if (t.action) { <button appButton variant="ghost" (click)="t.onAction()">{{ t.action }}</button> }
    </div>
  }
</div>
```
