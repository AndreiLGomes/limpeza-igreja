/**
 * <app-cartao-do-dia [dia]="dia" />: o cartão de uma limpeza na tela inicial e na escala (DiaCard, docs/06).
 * - Título: data por extenso. Detalhes: "19h às 21h · 3 de 5 vagas preenchidas". Etiqueta pelo statusDoDia.
 * - Este celular confirmou (X1): "Você vai nesta limpeza" + "Cancelar minha presença" (janela de confirmação).
 * - Senão, com vaga: "Confirmar presença". Sempre: "Ver tarefas".
 * - Com gente confirmada: "Cancelar uma presença" (X2), que pede o telefone usado.
 */
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  dataNaFrase, dataPorExtenso, esquemaCancelarPorTelefone, horario, statusDoDia, vagasLivres, type DiaPublico,
} from '@limpeza/compartilhado';
import {
  Botao, Campo, Cartao, ConteudoDoBotao, Entrada, Etiqueta, GrupoDeAvatares, Icone, Janela,
} from '@componentes';
import { validadorZod } from '@formularios';
import { FalhaNaApi } from '@nucleo/api';
import { Escala } from '@nucleo/escala';
import { mensagemDaFalha } from '@nucleo/falhas';
import { MinhasConfirmacoes } from '@nucleo/minhas-confirmacoes';

let proximoFormulario = 0;

@Component({
  selector: 'app-cartao-do-dia',
  imports: [
    Botao, Campo, Cartao, ConteudoDoBotao, Entrada, Etiqueta, GrupoDeAvatares, Icone, Janela, ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <app-cartao [titulo]="titulo()" [detalhes]="detalhes()">
      <app-etiqueta situacaoDoCartao [tom]="situacao().tom">{{ situacao().texto }}</app-etiqueta>
      <app-grupo-de-avatares [nomes]="nomes()" [total]="dia().vagas" />
      @if (euVou()) {
        <p class="cartao-do-dia__eu-vou"><app-icone nome="calendar-check" /> Você vai nesta limpeza</p>
      }
      <div acoesDoCartao>
        @if (euVou()) {
          <button appBotao variante="perigo-discreto" type="button" (click)="janelaDaMinha.set(true)">
            Cancelar minha presença
          </button>
        } @else if (temVaga()) {
          <a appBotao routerLink="/confirmar" [queryParams]="{ dia: dia().id }">Confirmar presença</a>
        }
        <a appBotao variante="discreto" routerLink="/tarefas" [queryParams]="{ dia: dia().id }">Ver tarefas</a>
        @if (dia().pessoas.length > 0) {
          <button appBotao variante="discreto" type="button" (click)="abrirJanelaDoTelefone()">Cancelar uma presença</button>
        }
      </div>
    </app-cartao>

    <!-- X1: cancelar pelo código guardado neste celular -->
    <app-janela titulo="Cancelar sua presença?" [(aberta)]="janelaDaMinha">
      <p class="dialog__text">Você sai da escala de {{ dataNaFrase() }}. A vaga fica livre para outra pessoa.</p>
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaDaMinha.set(false)">
          Manter presença
        </button>
        <button
          appBotao
          variante="perigo"
          type="button"
          [esperando]="cancelando()"
          [disabled]="cancelando()"
          (click)="cancelarMinhaPresenca()"
        >
          <app-conteudo-do-botao [esperando]="cancelando()" textoDeEspera="Cancelando…">Cancelar presença</app-conteudo-do-botao>
        </button>
      </div>
    </app-janela>

    <!-- X2: cancelar pelo telefone usado na confirmação -->
    <app-janela titulo="Cancelar uma presença?" [(aberta)]="janelaDoTelefone">
      <p class="dialog__text">
        Para confirmar que é você, digite o telefone que usou ao confirmar presença na {{ dataNaFrase() }}.
      </p>
      <form [id]="idDoFormulario" [formGroup]="formulario" (ngSubmit)="cancelarPorTelefone()" novalidate>
        <app-campo rotulo="Seu telefone" [controle]="formulario.controls.telefone">
          <input appEntrada type="tel" autocomplete="tel" placeholder="Ex.: 47 99999-9999" formControlName="telefone" />
        </app-campo>
      </form>
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaDoTelefone.set(false)">
          Manter presença
        </button>
        <button
          appBotao
          variante="perigo"
          type="submit"
          [attr.form]="idDoFormulario"
          [esperando]="cancelando()"
          [disabled]="cancelando()"
        >
          <app-conteudo-do-botao [esperando]="cancelando()" textoDeEspera="Cancelando…">Cancelar presença</app-conteudo-do-botao>
        </button>
      </div>
    </app-janela>
  `,
  styles: `
    :host {
      display: block;
    }
    .cartao-do-dia__eu-vou {
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--success);
      font-weight: bold;
    }
  `,
})
export class CartaoDoDia {
  readonly dia = input.required<DiaPublico>();

  private readonly escala = inject(Escala);
  private readonly minhasConfirmacoes = inject(MinhasConfirmacoes);

  protected readonly titulo = computed(() => dataPorExtenso(this.dia().data));
  protected readonly dataNaFrase = computed(() => dataNaFrase(this.dia().data));
  protected readonly detalhes = computed(() => {
    const dia = this.dia();
    return `${horario(dia.inicio, dia.fim)} · ${dia.pessoas.length} de ${dia.vagas} vagas preenchidas`;
  });
  protected readonly situacao = computed(() => statusDoDia(this.dia()));
  protected readonly nomes = computed(() => this.dia().pessoas.map((pessoa) => pessoa.nome));
  protected readonly euVou = computed(() => this.minhasConfirmacoes.confirmouEm(this.dia()));
  protected readonly temVaga = computed(() => vagasLivres(this.dia()) > 0);

  protected readonly janelaDaMinha = signal(false);
  protected readonly janelaDoTelefone = signal(false);
  protected readonly cancelando = signal(false);

  protected readonly idDoFormulario = `cancelar-por-telefone-${++proximoFormulario}`;
  protected readonly formulario = new FormGroup({
    telefone: new FormControl('', {
      nonNullable: true,
      validators: validadorZod(esquemaCancelarPorTelefone.shape.telefone),
    }),
  });

  protected async cancelarMinhaPresenca(): Promise<void> {
    this.cancelando.set(true);
    try {
      await this.escala.cancelarMinhaPresenca(this.dia());
      this.janelaDaMinha.set(false);
    } finally {
      this.cancelando.set(false);
    }
  }

  protected abrirJanelaDoTelefone(): void {
    this.formulario.reset();
    this.janelaDoTelefone.set(true);
  }

  /** X2, X3: telefone que não confere (ou bloqueio por tentativas) aparece embaixo do campo. */
  protected async cancelarPorTelefone(): Promise<void> {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.cancelando.set(true);
    try {
      await this.escala.cancelarPorTelefone(this.dia(), this.formulario.controls.telefone.value);
      this.janelaDoTelefone.set(false);
    } catch (erro) {
      const mensagem = (erro instanceof FalhaNaApi && erro.dados.campos?.['telefone']) || mensagemDaFalha(erro);
      this.formulario.controls.telefone.setErrors({ servidor: mensagem });
    } finally {
      this.cancelando.set(false);
    }
  }
}
