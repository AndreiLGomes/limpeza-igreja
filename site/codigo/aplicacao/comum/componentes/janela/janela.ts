/**
 * <app-janela>: janela que pede confirmação antes de algo sério (cancelar, remover, apagar) — o Dialog.
 * Usa o <dialog> nativo com showModal(), que prende o foco e fecha com Esc (armadilha 8 do docs/06).
 * O botão que NÃO faz nada vai primeiro e leva `autofocus`.
 *
 *   <app-janela titulo="Cancelar sua presença?" [(aberta)]="aberta">
 *     <p class="dialog__text">Você sai da escala de sexta, 16 de outubro.</p>
 *     <div acoesDaJanela>
 *       <button appBotao variante="secundario" autofocus (click)="aberta.set(false)">Manter presença</button>
 *       <button appBotao variante="perigo" (click)="cancelar()">Cancelar presença</button>
 *     </div>
 *   </app-janela>
 */
import { Component, effect, type ElementRef, input, model, viewChild } from '@angular/core';

let proximoId = 0;

@Component({
  selector: 'app-janela',
  styles: `
    /* Sem botões no encaixe, a linha de ações não ocupa espaço. */
    .dialog__actions:empty {
      display: none;
    }
  `,
  template: `
    <dialog #janela class="dialog" [attr.aria-labelledby]="idDoTitulo" (close)="aberta.set(false)">
      <h2 class="dialog__title" [id]="idDoTitulo">{{ titulo() }}</h2>
      <ng-content />
      <div class="dialog__actions">
        <ng-content select="[acoesDaJanela]" />
      </div>
    </dialog>
  `,
})
export class Janela {
  /** Sempre uma pergunta: "Cancelar sua presença?". */
  readonly titulo = input.required<string>();
  readonly aberta = model(false);

  protected readonly idDoTitulo = `janela-${++proximoId}`;
  private readonly janela = viewChild.required<ElementRef<HTMLDialogElement>>('janela');

  constructor() {
    // Sincroniza o signal `aberta` com a janela nativa (abrir com showModal, fechar com close).
    effect(() => {
      const janela = this.janela().nativeElement;
      if (this.aberta() && !janela.open) {
        if (typeof janela.showModal === 'function') janela.showModal();
        else janela.setAttribute('open', '');
      } else if (!this.aberta() && janela.open) {
        if (typeof janela.close === 'function') janela.close();
        else janela.removeAttribute('open');
      }
    });
  }
}
