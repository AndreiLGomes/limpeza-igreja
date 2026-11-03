/**
 * "/organizar": as próximas limpezas com quem confirmou, com telefone (TelaOrganizar; S13, O4, O5).
 * "Nova limpeza" é a única ação principal. Cada limpeza tem o lápis de editar. Remover pede confirmação.
 */
import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  dataNaFrase, dataPorExtenso, horario, statusDoDia, type DiaCompleto, type PessoaCompleta,
} from '@limpeza/compartilhado';
import { Botao, Cartao, Etiqueta, Icone, Janela, ListaDePessoas, Vazio } from '@componentes';
import { Limpezas } from '@nucleo/limpezas';
import { Estado } from '../../../comum/estado/estado';

interface Remocao {
  dia: DiaCompleto;
  pessoa: PessoaCompleta;
}

@Component({
  selector: 'app-tela-limpezas',
  imports: [Botao, Cartao, Estado, Etiqueta, Icone, Janela, ListaDePessoas, RouterLink, Vazio],
  template: `
    <div class="pagina">
      <div class="cabecalho">
        <h1 class="title">Limpezas</h1>
        <a appBotao routerLink="/organizar/limpeza/nova"><app-icone nome="plus" /> Nova limpeza</a>
      </div>

      <app-estado
        [estado]="limpezas.estado()"
        [erro]="limpezas.erro()"
        textoCarregando="Carregando as limpezas…"
        (tentar)="limpezas.carregar()"
      >
        @for (dia of limpezas.dias(); track dia.id) {
          <app-cartao [titulo]="titulo(dia)" [detalhes]="detalhes(dia)">
            <a
              situacaoDoCartao
              appBotao
              variante="discreto"
              icone
              [routerLink]="['/organizar/limpeza', dia.id]"
              [attr.aria-label]="'Editar ' + dataNaFrase(dia.data)"
            >
              <app-icone nome="pencil" />
            </a>
            @if (dia.pessoas.length > 0) {
              <app-lista-de-pessoas [pessoas]="dia.pessoas" [total]="dia.vagas" (remover)="pedirRemocao(dia, $event)" />
            } @else {
              <app-etiqueta class="sozinha" [tom]="situacao(dia).tom">{{ situacao(dia).texto }}</app-etiqueta>
            }
          </app-cartao>
        } @empty {
          <div class="card">
            <app-vazio titulo="Nenhuma limpeza marcada" texto="Cadastre a próxima limpeza para ela aparecer na escala.">
              <a appBotao variante="secundario" routerLink="/organizar/limpeza/nova">Cadastrar limpeza</a>
            </app-vazio>
          </div>
        }
      </app-estado>
    </div>

    <app-janela [titulo]="'Remover ' + (remocao()?.pessoa?.nome ?? '') + '?'" [(aberta)]="janelaAberta">
      @if (remocao(); as remocao) {
        <p class="dialog__text">
          {{ remocao.pessoa.nome }} sai da escala de {{ dataNaFrase(remocao.dia.data) }}. Você pode desfazer logo depois.
        </p>
      }
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaAberta.set(false)">Manter</button>
        <button appBotao variante="perigo" type="button" (click)="remover()">Remover</button>
      </div>
    </app-janela>
  `,
  styles: `
    .cabecalho {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }
    .sozinha {
      align-self: flex-start;
    }
  `,
})
export class TelaLimpezas implements OnInit {
  protected readonly limpezas = inject(Limpezas);

  protected readonly janelaAberta = signal(false);
  protected readonly remocao = signal<Remocao | null>(null);

  protected readonly dataNaFrase = dataNaFrase;

  ngOnInit(): void {
    void this.limpezas.carregar();
  }

  protected titulo(dia: DiaCompleto): string {
    return dataPorExtenso(dia.data);
  }

  /** "19h às 21h · 3 de 5 vagas · 4 tarefas" (TelaOrganizar). */
  protected detalhes(dia: DiaCompleto): string {
    const tarefas = dia.tarefas.length === 1 ? '1 tarefa' : `${dia.tarefas.length} tarefas`;
    return `${horario(dia.inicio, dia.fim)} · ${dia.pessoas.length} de ${dia.vagas} vagas · ${tarefas}`;
  }

  protected situacao(dia: DiaCompleto) {
    return statusDoDia(dia);
  }

  protected pedirRemocao(dia: DiaCompleto, pessoa: PessoaCompleta): void {
    this.remocao.set({ dia, pessoa });
    this.janelaAberta.set(true);
  }

  protected async remover(): Promise<void> {
    const remocao = this.remocao();
    this.janelaAberta.set(false);
    if (remocao) await this.limpezas.removerPessoa(remocao.dia, remocao.pessoa);
  }
}
