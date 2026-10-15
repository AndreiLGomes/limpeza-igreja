/**
 * "/tarefas?dia=ID": as tarefas de uma sexta (TelaTarefas). Sem `dia`, a próxima sexta.
 * Marcar e desmarcar muda a tela na hora; se o servidor falhar, volta (T3). Contador e etiqueta (T5).
 */
import { Component, computed, inject, input, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { contadorDeTarefas, dataPorExtenso, statusDasTarefas } from '@limpeza/compartilhado';
import { Botao, Cartao, Etiqueta, ItemDeTarefa, Vazio } from '@componentes';
import { Escala } from '@nucleo/escala';
import { Estado } from '../../comum/estado/estado';

@Component({
  selector: 'app-tela-tarefas',
  imports: [Botao, Cartao, Estado, Etiqueta, ItemDeTarefa, RouterLink, Vazio],
  template: `
    <div class="pagina">
      <h1 class="title">Tarefas</h1>
      <app-estado
        [estado]="escala.estado()"
        [erro]="escala.erro()"
        textoCarregando="Carregando as tarefas…"
        (tentar)="escala.carregar()"
      >
        @if (diaEscolhido(); as dia) {
          <app-cartao [titulo]="titulo()" [detalhes]="contador()">
            @if (situacao(); as situacao) {
              <app-etiqueta situacaoDoCartao [tom]="situacao.tom">{{ situacao.texto }}</app-etiqueta>
            }
            @if (dia.tarefas.length > 0) {
              <div class="tarefas">
                @for (tarefa of dia.tarefas; track tarefa.id) {
                  <app-item-de-tarefa
                    [tarefa]="tarefa.nome"
                    [feita]="tarefa.feita"
                    (feitaChange)="escala.marcarTarefa(dia, tarefa, $event)"
                  />
                }
              </div>
            } @else {
              <app-vazio
                icone="brush"
                titulo="Nenhuma tarefa nesta sexta"
                texto="Quando quem organiza cadastrar as tarefas, elas aparecem aqui."
              />
            }
          </app-cartao>
        } @else {
          <div class="card">
            <app-vazio
              [titulo]="dia() ? 'Essa sexta não está na escala' : 'Nenhuma sexta marcada'"
              [texto]="dia() ? 'Ela pode ter passado ou sido apagada.' : 'Quando quem organiza cadastrar as próximas limpezas, elas aparecem aqui.'"
            >
              @if (dia()) {
                <a appBotao variante="secundario" routerLink="/escala">Ver a escala</a>
              }
            </app-vazio>
          </div>
        }
      </app-estado>
    </div>
  `,
  styles: `
    /* As tarefas encostam nas bordas do cartão (TelaTarefas). */
    .tarefas {
      margin: 0 calc(-1 * var(--space-4));
    }
    .tarefas app-item-de-tarefa:last-child ::ng-deep .check {
      border-bottom: 0;
    }
  `,
})
export class TelaTarefas implements OnInit {
  /** "?dia=ID" do endereço (withComponentInputBinding). */
  readonly dia = input<string>();

  protected readonly escala = inject(Escala);

  protected readonly diaEscolhido = computed(() => {
    const id = this.dia();
    return id ? this.escala.buscar(id) : this.escala.proximo();
  });
  protected readonly titulo = computed(() => dataPorExtenso(this.diaEscolhido()?.data ?? ''));
  protected readonly contador = computed(() => contadorDeTarefas(this.diaEscolhido()?.tarefas ?? []));
  protected readonly situacao = computed(() => statusDasTarefas(this.diaEscolhido()?.tarefas ?? []));

  ngOnInit(): void {
    void this.escala.carregar();
  }
}
