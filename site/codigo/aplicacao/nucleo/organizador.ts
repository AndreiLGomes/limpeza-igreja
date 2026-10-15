/**
 * organizador.ts: a sessão de quem organiza (docs/05 e docs/06).
 * - O token fica no sessionStorage: some quando a aba fecha, de propósito.
 * - `exigirOrganizador` protege as rotas /organizar (menos /organizar/entrar).
 * - `interceptadorDoOrganizador` põe "Authorization: Bearer …" nos endereços do organizador e, ao
 *   receber 401 SESSAO_EXPIRADA, esquece a sessão e leva para a tela de senha.
 */
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ROTAS, type SessaoCriada } from '@limpeza/compartilhado';
import { Api } from './api';
import { apagar, gravar, ler } from './armazenamento';

const CHAVE = 'sessao-organizador';
const TELA_DE_SENHA = '/organizar/entrar';

function lerSessao(): SessaoCriada | null {
  try {
    const sessao = JSON.parse(ler('sessao', CHAVE) ?? 'null') as Partial<SessaoCriada> | null;
    return sessao && typeof sessao.token === 'string' && typeof sessao.expiraEm === 'string'
      ? (sessao as SessaoCriada)
      : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Organizador {
  private readonly api = inject(Api);
  private readonly roteador = inject(Router);

  private readonly sessao = signal<SessaoCriada | null>(lerSessao());

  readonly token = computed(() => this.sessao()?.token ?? null);

  /** Entrou e a sessão ainda vale (O2: 12 horas). O servidor confere de novo em toda chamada. */
  readonly logado = computed(() => {
    const sessao = this.sessao();
    return sessao !== null && new Date(sessao.expiraEm).getTime() > Date.now();
  });

  /** O1, O2: senha certa guarda o token. Erros (senha incorreta, bloqueio) seguem para a tela. */
  async entrar(senha: string): Promise<void> {
    const sessao = await this.api.entrar(senha);
    this.sessao.set(sessao);
    gravar('sessao', CHAVE, JSON.stringify(sessao));
  }

  /** O6: "Sair" encerra a sessão no servidor e volta para a tela inicial. */
  async sair(): Promise<void> {
    try {
      await this.api.sair();
    } catch {
      // Mesmo sem conexão, a sessão é esquecida neste aparelho.
    }
    this.esquecerSessao();
    await this.roteador.navigateByUrl('/');
  }

  esquecerSessao(): void {
    this.sessao.set(null);
    apagar('sessao', CHAVE);
  }
}

/** Guarda das rotas do organizador: sem sessão, vai para a tela de senha. */
export const exigirOrganizador: CanActivateFn = () => {
  const organizador = inject(Organizador);
  return organizador.logado() || inject(Router).parseUrl(TELA_DE_SENHA);
};

/** Guarda da tela de senha: quem já entrou vai direto para a lista de sextas. */
export const quemNaoEntrou: CanActivateFn = () =>
  !inject(Organizador).logado() || inject(Router).parseUrl('/organizar');

/** Só os endereços do organizador levam o token (o de "entrar" ainda não tem). */
function ehDoOrganizador(url: string): boolean {
  return url.includes('/organizador/') && !url.endsWith(ROTAS.organizador.entrar);
}

export const interceptadorDoOrganizador: HttpInterceptorFn = (requisicao, proximo) => {
  if (!ehDoOrganizador(requisicao.url)) return proximo(requisicao);

  const organizador = inject(Organizador);
  const roteador = inject(Router);
  const token = organizador.token();
  const comToken = token ? requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : requisicao;

  return proximo(comToken).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse && erro.status === 401 && !requisicao.url.endsWith(ROTAS.organizador.sair)) {
        organizador.esquecerSessao();
        void roteador.navigateByUrl(TELA_DE_SENHA);
      }
      return throwError(() => erro);
    }),
  );
};
