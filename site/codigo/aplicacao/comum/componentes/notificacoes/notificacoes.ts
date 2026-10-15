/**
 * Notificações (Toast do Design System): mensagem curta depois de uma ação, que some sozinha
 * (5 s; 8 s com botão de ação). O serviço Notificacoes é o único jeito de mostrar uma;
 * <app-area-de-notificacoes /> fica UMA vez na aplicação. No máximo 3 na tela (a mais antiga sai).
 *
 *   notificacoes.mostrar('Presença confirmada para sexta, 16 de outubro.');
 *   notificacoes.mostrar('Tarefa marcada como feita.', { acao: 'Desfazer', aoAgir: () => desfazer() });
 *   notificacoes.erro('Sem conexão. Não foi possível salvar.', { acao: 'Tentar de novo', aoAgir: ... });
 */
import { Component, inject, Injectable, signal } from '@angular/core';
import { Botao } from '../botao/botao';

const DURACAO_MS = 5_000;
const DURACAO_COM_ACAO_MS = 8_000;
const MAXIMO_NA_TELA = 3;

export interface OpcoesDaNotificacao {
  /** Texto do botão, ex.: "Desfazer". */
  acao?: string;
  aoAgir?: () => void;
}

export interface Notificacao extends OpcoesDaNotificacao {
  id: number;
  texto: string;
  ehErro: boolean;
}

@Injectable({ providedIn: 'root' })
export class Notificacoes {
  private proximoId = 0;
  private readonly _lista = signal<Notificacao[]>([]);
  readonly lista = this._lista.asReadonly();

  mostrar(texto: string, opcoes: OpcoesDaNotificacao = {}): void {
    this.adicionar({ ...opcoes, texto, ehErro: false });
  }

  erro(texto: string, opcoes: OpcoesDaNotificacao = {}): void {
    this.adicionar({ ...opcoes, texto, ehErro: true });
  }

  fechar(id: number): void {
    this._lista.update((lista) => lista.filter((notificacao) => notificacao.id !== id));
  }

  /** Clique no botão de ação: faz a ação e tira a notificação. */
  executar(notificacao: Notificacao): void {
    this.fechar(notificacao.id);
    notificacao.aoAgir?.();
  }

  private adicionar(dados: Omit<Notificacao, 'id'>): void {
    const notificacao: Notificacao = { ...dados, id: ++this.proximoId };
    this._lista.update((lista) => [...lista, notificacao].slice(-MAXIMO_NA_TELA));
    setTimeout(() => this.fechar(notificacao.id), notificacao.acao ? DURACAO_COM_ACAO_MS : DURACAO_MS);
  }
}

@Component({
  selector: 'app-area-de-notificacoes',
  imports: [Botao],
  template: `
    <div class="toast-area">
      @for (notificacao of notificacoes.lista(); track notificacao.id) {
        <div class="toast" [attr.role]="notificacao.ehErro ? 'alert' : 'status'">
          <span class="toast__text">{{ notificacao.texto }}</span>
          @if (notificacao.acao) {
            <button appBotao variante="discreto" type="button" (click)="notificacoes.executar(notificacao)">
              {{ notificacao.acao }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class AreaDeNotificacoes {
  protected readonly notificacoes = inject(Notificacoes);
}
