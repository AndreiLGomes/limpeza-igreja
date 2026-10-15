/**
 * api.ts: a ÚNICA classe que faz requisições ao servidor (docs/06).
 * Os endereços vêm de ROTAS e os tipos de resposta do @limpeza/compartilhado.
 * Qualquer erro vira FalhaNaApi com o formato da API ({ codigo, mensagem, campos });
 * sem conexão vira o código SEM_CONEXAO.
 */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';
import {
  ehCodigoDeErro, mensagemDoErro, ROTAS, type ConfirmacaoCriada, type DiaPublico,
  type EntradaConfirmacao, type ErroApi, type Tarefa,
} from '@limpeza/compartilhado';
import { URL_DA_API } from './ambiente';

/** Erro de uma chamada à API, já no formato que a tela mostra. */
export class FalhaNaApi extends Error {
  constructor(readonly dados: ErroApi) {
    super(dados.mensagem);
    this.name = 'FalhaNaApi';
  }

  get codigo() {
    return this.dados.codigo;
  }
}

/** Transforma qualquer erro de requisição em FalhaNaApi. */
function paraFalha(erro: unknown): FalhaNaApi {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) {
      return new FalhaNaApi({ codigo: 'SEM_CONEXAO', mensagem: mensagemDoErro('SEM_CONEXAO') });
    }
    const corpo = erro.error as Partial<ErroApi> | null;
    if (corpo && ehCodigoDeErro(corpo.codigo) && typeof corpo.mensagem === 'string') {
      return new FalhaNaApi(corpo as ErroApi);
    }
  }
  return new FalhaNaApi({ codigo: 'ERRO_INTERNO', mensagem: mensagemDoErro('ERRO_INTERNO') });
}

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  private async pedir<T>(requisicao: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(requisicao);
    } catch (erro) {
      throw paraFalha(erro);
    }
  }

  /** URL_DA_API já termina em "/api"; os caminhos de ROTAS vêm depois dele. */
  private url(caminho: string): string {
    return `${URL_DA_API}${caminho}`;
  }

  // ---------- Parte pública ----------

  escala(): Promise<DiaPublico[]> {
    return this.pedir(this.http.get<DiaPublico[]>(this.url(ROTAS.dias)));
  }

  dia(id: string): Promise<DiaPublico> {
    return this.pedir(this.http.get<DiaPublico>(this.url(ROTAS.dia(id))));
  }

  confirmar(diaId: string, dados: EntradaConfirmacao): Promise<ConfirmacaoCriada> {
    return this.pedir(this.http.post<ConfirmacaoCriada>(this.url(ROTAS.confirmar(diaId)), dados));
  }

  cancelarPorCodigo(codigoCancelamento: string): Promise<void> {
    return this.pedir(this.http.post<void>(this.url(ROTAS.cancelarPorCodigo), { codigoCancelamento }));
  }

  cancelarPorTelefone(diaId: string, telefone: string): Promise<void> {
    return this.pedir(this.http.post<void>(this.url(ROTAS.cancelarPorTelefone(diaId)), { telefone }));
  }

  marcarTarefa(diaId: string, tarefaId: string, feita: boolean): Promise<Tarefa> {
    return this.pedir(this.http.patch<Tarefa>(this.url(ROTAS.tarefa(diaId, tarefaId)), { feita }));
  }
}
