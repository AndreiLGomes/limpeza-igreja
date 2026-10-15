/**
 * <app-dialog>: janela que pede confirmação antes de algo sério (cancelar, remover, apagar).
 * Usa o <dialog> nativo com showModal(), que prende o foco e fecha com Esc (armadilha 8 do docs/06).
 * O botão que NÃO faz nada vai primeiro e leva `autofocus`.
 *
 *   <app-dialog title="Cancelar sua presença?" [(open)]="aberto">
 *     <p class="dialog__text">Você sai da escala de sexta, 16 de outubro.</p>
 *     <div dialogActions>
 *       <button appButton variant="secondary" autofocus (click)="aberto.set(false)">Manter presença</button>
 *       <button appButton variant="danger" (click)="cancelar()">Cancelar presença</button>
 *     </div>
 *   </app-dialog>
 */
import { Component, effect, type ElementRef, input, model, viewChild } from '@angular/core';

let proximoId = 0;

@Component({
  selector: 'app-dialog',
  template: `
    <dialog #janela class="dialog" [attr.aria-labelledby]="idDoTitulo" (close)="open.set(false)">
      <h2 class="dialog__title" [id]="idDoTitulo">{{ title() }}</h2>
      <ng-content />
      <div class="dialog__actions">
        <ng-content select="[dialogActions]" />
      </div>
    </dialog>
  `,
})
export class Dialog {
  /** Sempre uma pergunta: "Cancelar sua presença?". */
  readonly title = input.required<string>();
  readonly open = model(false);

  protected readonly idDoTitulo = `janela-${++proximoId}`;
  private readonly janela = viewChild.required<ElementRef<HTMLDialogElement>>('janela');

  constructor() {
    // Sincroniza o signal `open` com a janela nativa (abrir com showModal, fechar com close).
    effect(() => {
      const janela = this.janela().nativeElement;
      if (this.open() && !janela.open) {
        if (typeof janela.showModal === 'function') janela.showModal();
        else janela.setAttribute('open', '');
      } else if (!this.open() && janela.open) {
        if (typeof janela.close === 'function') janela.close();
        else janela.removeAttribute('open');
      }
    });
  }
}
