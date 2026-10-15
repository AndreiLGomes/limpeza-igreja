/**
 * "/organizar": as próximas sextas com quem confirmou, com telefone (TelaOrganizar; S13, O4, O5).
 * "Nova sexta" é a única ação principal. Cada sexta tem o lápis de editar. Remover pede confirmação.
 */
import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  dataNaFrase, dataPorExtenso, horario, statusDoDia, type DiaCompleto, type PessoaCompleta,
} from '@limpeza/compartilhado';
import { Botao, Cartao, Etiqueta, Icone, Janela, ListaDePessoas, Vazio } from '@componentes';
import { Sextas } from '@nucleo/sextas';
import { Estado } from '../../../comum/estado/estado';

interface Remocao {
  dia: DiaCompleto;
  pessoa: PessoaCompleta;
}

@Component({
  selector: 'app-tela-sextas',
  imports: [Botao, Cartao, Estado, Etiqueta, Icone, Janela, ListaDePessoas, RouterLink, Vazio],
  template: `
    <div class="pagina">
      <div class="cabecalho">
        <h1 class="title">Sextas</h1>
        <a appBotao routerLink="/organizar/sexta/nova"><app-icone nome="plus" /> Nova sexta</a>
      </div>

      <app-estado
        [estado]="sextas.estado()"
        [erro]="sextas.erro()"
        textoCarregando="Carregando as sextas…"
        (tentar)="sextas.carregar()"
      >
        @for (dia of sextas.dias(); track dia.id) {
          <app-cartao [titulo]="titulo(dia)" [detalhes]="detalhes(dia)">
            <a
              situacaoDoCartao
              appBotao
              variante="discreto"
              icone
              [routerLink]="['/organizar/sexta', dia.id]"
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
            <app-vazio titulo="Nenhuma sexta marcada" texto="Cadastre a próxima limpeza para ela aparecer na escala.">
              <a appBotao variante="secundario" routerLink="/organizar/sexta/nova">Cadastrar sexta</a>
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
export class TelaSextas implements OnInit {
  protected readonly sextas = inject(Sextas);

  protected readonly janelaAberta = signal(false);
  protected readonly remocao = signal<Remocao | null>(null);

  protected readonly dataNaFrase = dataNaFrase;

  ngOnInit(): void {
    void this.sextas.carregar();
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
    if (remocao) await this.sextas.removerPessoa(remocao.dia, remocao.pessoa);
  }
}
