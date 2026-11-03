/**
 * Carga<T>: dados que vêm do servidor, com o estado da carga ('carregando' | 'pronto' | 'erro') e a
 * mensagem de erro — tudo o que o <app-estado> precisa. Usada pela escala pública e pelas limpezas do
 * organizador, para não repetir a mesma lógica.
 */
import { signal, type WritableSignal } from '@angular/core';
import type { EstadoDaCarga } from '../comum/estado/estado';
import { mensagemDaFalha } from './falhas';

export class Carga<T> {
  readonly dados: WritableSignal<T>;
  readonly estado = signal<EstadoDaCarga>('carregando');
  readonly erro = signal<string | null>(null);

  constructor(
    private readonly buscar: () => Promise<T>,
    inicial: T,
    /** Roda depois de cada carga que deu certo (ex.: limpar confirmações que sumiram, X6). */
    private readonly aoCarregar?: (dados: T) => void,
  ) {
    this.dados = signal(inicial);
  }

  /** Carrega mostrando as linhas cinzas; se falhar, mostra o erro com "Tentar de novo". */
  async carregar(): Promise<void> {
    this.estado.set('carregando');
    try {
      this.receber(await this.buscar());
      this.erro.set(null);
      this.estado.set('pronto');
    } catch (erro) {
      this.erro.set(mensagemDaFalha(erro));
      this.estado.set('erro');
    }
  }

  /** Recarrega sem voltar às linhas cinzas (depois de salvar algo). Se falhar, a tela fica como estava. */
  async atualizar(): Promise<void> {
    try {
      this.receber(await this.buscar());
    } catch {
      // A próxima carga tenta de novo.
    }
  }

  private receber(dados: T): void {
    this.dados.set(dados);
    this.aoCarregar?.(dados);
  }
}
