/**
 * Toast: mensagem curta depois de uma ação, que some sozinha (5 s; 8 s com botão de ação).
 * ToastService é o único jeito de mostrar uma; <app-toast-area /> fica UMA vez no app.html.
 * No máximo 3 na tela (a mais antiga sai).
 *
 *   toast.show('Presença confirmada para sexta, 16 de outubro.');
 *   toast.show('Tarefa marcada como feita.', { action: 'Desfazer', onAction: () => desfazer() });
 *   toast.error('Sem conexão. Não foi possível salvar.', { action: 'Tentar de novo', onAction: ... });
 */
import { Component, inject, Injectable, signal } from '@angular/core';
import { Button } from '../button/button';

const DURACAO_MS = 5_000;
const DURACAO_COM_ACAO_MS = 8_000;
const MAXIMO_NA_TELA = 3;

export interface OpcoesDoToast {
  action?: string;
  onAction?: () => void;
}

export interface Toast extends OpcoesDoToast {
  id: number;
  texto: string;
  erro: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private proximoId = 0;
  private readonly _lista = signal<Toast[]>([]);
  readonly lista = this._lista.asReadonly();

  show(texto: string, opcoes: OpcoesDoToast = {}): void {
    this.adicionar({ ...opcoes, texto, erro: false });
  }

  error(texto: string, opcoes: OpcoesDoToast = {}): void {
    this.adicionar({ ...opcoes, texto, erro: true });
  }

  fechar(id: number): void {
    this._lista.update((lista) => lista.filter((toast) => toast.id !== id));
  }

  /** Clique no botão de ação: faz a ação e tira o toast. */
  executar(toast: Toast): void {
    this.fechar(toast.id);
    toast.onAction?.();
  }

  private adicionar(dados: Omit<Toast, 'id'>): void {
    const toast: Toast = { ...dados, id: ++this.proximoId };
    this._lista.update((lista) => [...lista, toast].slice(-MAXIMO_NA_TELA));
    setTimeout(() => this.fechar(toast.id), toast.action ? DURACAO_COM_ACAO_MS : DURACAO_MS);
  }
}

@Component({
  selector: 'app-toast-area',
  imports: [Button],
  template: `
    <div class="toast-area">
      @for (toast of toasts.lista(); track toast.id) {
        <div class="toast" [attr.role]="toast.erro ? 'alert' : 'status'">
          <span class="toast__text">{{ toast.texto }}</span>
          @if (toast.action) {
            <button appButton variant="ghost" type="button" (click)="toasts.executar(toast)">{{ toast.action }}</button>
          }
        </div>
      }
    </div>
  `,
})
export class ToastArea {
  protected readonly toasts = inject(ToastService);
}
