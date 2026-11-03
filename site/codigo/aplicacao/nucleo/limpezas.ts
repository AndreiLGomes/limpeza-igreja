/**
 * limpezas.ts: as limpezas na área de quem organiza (S13, O4, O5) — com telefones, só para quem entrou.
 * Mesmo padrão da escala pública: a Carga cuida de carregando / pronto / erro.
 */
import { inject, Injectable } from '@angular/core';
import { dataNaFrase, type DiaCompleto, type EntradaDia, type PessoaCompleta } from '@limpeza/compartilhado';
import { Notificacoes } from '@componentes';
import { Api } from './api';
import { Carga } from './carga';
import { notificarFalha } from './falhas';

@Injectable({ providedIn: 'root' })
export class Limpezas {
  private readonly api = inject(Api);
  private readonly notificacoes = inject(Notificacoes);

  private readonly carga = new Carga<DiaCompleto[]>(() => this.api.limpezasDoOrganizador(), []);
  readonly dias = this.carga.dados.asReadonly();
  readonly estado = this.carga.estado.asReadonly();
  readonly erro = this.carga.erro.asReadonly();

  carregar(): Promise<void> {
    return this.carga.carregar();
  }

  buscar(id: string): Promise<DiaCompleto> {
    return this.api.limpezaDoOrganizador(id);
  }

  /** S7: as tarefas da limpeza mais recente, para o formulário de nova limpeza já vir preenchido. */
  sugestaoDeTarefas(): Promise<string[]> {
    return this.api.sugestaoDeTarefas();
  }

  async criar(dados: EntradaDia): Promise<void> {
    const criada = await this.api.criarLimpeza(dados);
    this.notificacoes.mostrar(`Limpeza criada para ${dataNaFrase(criada.data)}.`);
  }

  async editar(id: string, dados: EntradaDia): Promise<void> {
    await this.api.editarLimpeza(id, dados);
    this.notificacoes.mostrar('Alterações salvas.');
  }

  /** S11: apaga a limpeza com as confirmações e tarefas. Não tem "Desfazer". */
  async apagar(id: string): Promise<void> {
    await this.api.apagarLimpeza(id);
    this.notificacoes.mostrar('Limpeza apagada.');
  }

  /**
   * O5: remove a pessoa e oferece "Desfazer", que recria a confirmação com os mesmos dados.
   * Se a vaga foi ocupada nesse meio-tempo, mostra o erro de vagas.
   */
  async removerPessoa(dia: DiaCompleto, pessoa: PessoaCompleta): Promise<void> {
    try {
      const removida = await this.api.removerPessoa(dia.id, pessoa.id);
      this.notificacoes.mostrar(`${removida.nome} foi removido(a) da escala.`, {
        acao: 'Desfazer',
        aoAgir: () => void this.desfazerRemocao(dia, removida),
      });
    } catch (erro) {
      notificarFalha(this.notificacoes, erro);
    }
    await this.carga.atualizar();
  }

  private async desfazerRemocao(dia: DiaCompleto, pessoa: PessoaCompleta): Promise<void> {
    try {
      await this.api.desfazerRemocao(dia.id, {
        nome: pessoa.nome,
        telefone: pessoa.telefone,
        tempo: pessoa.tempo,
        observacao: pessoa.observacao,
      });
    } catch (erro) {
      notificarFalha(this.notificacoes, erro);
    }
    await this.carga.atualizar();
  }
}
