/**
 * <app-lista-de-presenca [dia] (mudou)>: a lista de presença na tela da limpeza do organizador (L8, L13, L14).
 * - Mostra TODAS as pessoas confirmadas; quem não marcou aparece como "não marcou presença". Tocar abre
 *   "Corrigir presença", onde o organizador também preenche a entrada de quem está sem celular.
 * - "Adicionar pessoa" cadastra quem chegou sem confirmar e sem celular (telefone opcional, L14).
 * - "Encerrar limpeza" grava a saída ESCOLHIDA em quem marcou entrada e não saiu, sem assinar por ninguém.
 */
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  errosPorCampo, esquemaCorrecaoPresenca, esquemaPessoaNaPresenca, hoje, horaAgora, MENSAGENS,
  type DiaCompleto, type PessoaCompleta,
} from '@limpeza/compartilhado';
import {
  AcoesDoFormulario, Botao, Campo, ConteudoDoBotao, deSimNao, Entrada, Escolhas, estadoDoControle, Janela,
  Notificacoes, OPCOES_SIM_NAO, paraSimNao,
} from '@componentes';
import { mostrarErrosNosCampos } from '@formularios';
import { FalhaNaApi } from '@nucleo/api';
import { mensagemDaFalha } from '@nucleo/falhas';
import { Limpezas } from '@nucleo/limpezas';

@Component({
  selector: 'app-lista-de-presenca',
  imports: [AcoesDoFormulario, Botao, Campo, ConteudoDoBotao, Entrada, Escolhas, Janela, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2 class="card__title">Lista de presença</h2>
      @if (pessoas().length > 0) {
        <ul class="list">
          @for (pessoa of pessoas(); track pessoa.id) {
            <li class="list__item">
              <button appBotao variante="discreto" type="button" class="lista-de-presenca__pessoa" (click)="abrir(pessoa)">
                <span class="list__title">{{ pessoa.nome }}</span>
                <span class="list__sub">{{ resumo(pessoa) }}</span>
              </button>
            </li>
          }
        </ul>
      } @else {
        <p class="form__desc">Ninguém confirmou presença nesta limpeza.</p>
      }
      <div appAcoesDoFormulario>
        <button appBotao variante="secundario" type="button" (click)="abrirNova()">Adicionar pessoa</button>
        @if (faltaSair() > 0) {
          <button appBotao variante="secundario" type="button" (click)="abrirEncerrar()">Encerrar limpeza</button>
        }
      </div>
    </section>

    <app-janela [titulo]="tituloDaJanela()" [(aberta)]="janelaDaPessoa">
      @if (emCorrecao()?.assinadoEm) {
        <p class="dialog__text">Mudar a entrada ou o EPI desfaz a assinatura desta pessoa. Ela vai assinar no papel.</p>
      }
      <form id="presenca-da-pessoa" [formGroup]="formulario" (ngSubmit)="salvar()" novalidate>
        @if (!emCorrecao()) {
          <app-campo rotulo="Nome" obrigatorio [controle]="formulario.controls.nome">
            <input appEntrada autocomplete="off" formControlName="nome" />
          </app-campo>
          <app-campo rotulo="Telefone" dica="Opcional: só para quem tem celular." [controle]="formulario.controls.telefone">
            <input appEntrada type="tel" inputmode="tel" formControlName="telefone" />
          </app-campo>
        }
        <app-campo rotulo="Nº de adesão" [controle]="formulario.controls.numeroAdesao">
          <input appEntrada inputmode="numeric" formControlName="numeroAdesao" />
        </app-campo>
        <app-campo rotulo="Código da função" [controle]="formulario.controls.codigoFuncao">
          <input appEntrada inputmode="numeric" formControlName="codigoFuncao" />
        </app-campo>
        <app-escolhas legenda="Recebeu EPI?" emLinha formControlName="recebeuEpi" [opcoes]="opcoesDeEpi" />
        <app-campo rotulo="Entrada" [controle]="formulario.controls.entrada">
          <input appEntrada type="time" formControlName="entrada" />
        </app-campo>
        <app-campo rotulo="Saída" [controle]="formulario.controls.saida">
          <input appEntrada type="time" formControlName="saida" />
        </app-campo>
      </form>
      <div acoesDaJanela>
        @if (emCorrecao()?.assinadoEm) {
          <button appBotao variante="perigo-discreto" type="button" (click)="salvar(true)">Desfazer assinatura</button>
        }
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaDaPessoa.set(false)">Voltar</button>
        <button appBotao type="submit" form="presenca-da-pessoa" [esperando]="salvando()" [disabled]="salvando()">
          <app-conteudo-do-botao [esperando]="salvando()">Salvar</app-conteudo-do-botao>
        </button>
      </div>
    </app-janela>

    <app-janela titulo="Encerrar a limpeza?" [(aberta)]="janelaDeEncerrar">
      <form id="encerrar-limpeza" [formGroup]="formularioDeEncerrar" (ngSubmit)="encerrar()" novalidate>
        <app-campo rotulo="Hora da saída" obrigatorio [controle]="formularioDeEncerrar.controls.saida">
          <input appEntrada type="time" formControlName="saida" />
        </app-campo>
      </form>
      <p class="dialog__text">{{ textoDeEncerrar() }}</p>
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaDeEncerrar.set(false)">Voltar</button>
        <button appBotao type="submit" form="encerrar-limpeza" [esperando]="salvando()" [disabled]="salvando()">
          <app-conteudo-do-botao [esperando]="salvando()">Encerrar</app-conteudo-do-botao>
        </button>
      </div>
    </app-janela>
  `,
  styles: `
    /* O resumo é longo: quebra linha dentro do botão, sem empurrar a página para o lado (375px). */
    .lista-de-presenca__pessoa {
      flex: 1;
      min-width: 0;
      flex-direction: column;
      align-items: flex-start;
      text-align: start;
      white-space: normal;
    }
  `,
})
export class ListaDePresenca {
  readonly dia = input.required<DiaCompleto>();
  readonly mudou = output<DiaCompleto>();

  private readonly limpezas = inject(Limpezas);
  private readonly notificacoes = inject(Notificacoes);

  protected readonly opcoesDeEpi = OPCOES_SIM_NAO;
  protected readonly salvando = signal(false);
  protected readonly janelaDaPessoa = signal(false);
  protected readonly janelaDeEncerrar = signal(false);
  /** A pessoa em correção; null quando a janela está cadastrando alguém novo (L14). */
  protected readonly emCorrecao = signal<PessoaCompleta | null>(null);

  /** Todas as pessoas: primeiro quem marcou entrada (em ordem de entrada), depois as outras (por nome). */
  protected readonly pessoas = computed(() =>
    [...this.dia().pessoas].sort((a, b) => {
      if (a.entrada && b.entrada) return a.entrada.localeCompare(b.entrada);
      if (a.entrada || b.entrada) return a.entrada ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    }),
  );
  protected readonly faltaSair = computed(() => this.pessoas().filter((p) => p.entrada && !p.saida).length);
  protected readonly tituloDaJanela = computed(() => {
    const pessoa = this.emCorrecao();
    if (!pessoa) return 'Adicionar pessoa';
    return `${pessoa.entrada ? 'Corrigir' : 'Marcar'} presença de ${pessoa.nome}`;
  });

  protected readonly formulario = new FormGroup({
    nome: new FormControl<string | null>(null),
    telefone: new FormControl<string | null>(null),
    numeroAdesao: new FormControl<string | null>(null),
    codigoFuncao: new FormControl<string | null>(null),
    recebeuEpi: new FormControl<string | null>(null),
    entrada: new FormControl<string | null>(null),
    saida: new FormControl<string | null>(null),
  });

  protected readonly formularioDeEncerrar = new FormGroup({
    saida: new FormControl('', { nonNullable: true }),
  });
  private readonly saidaEscolhida = estadoDoControle(
    () => this.formularioDeEncerrar.controls.saida,
    (controle) => controle.value,
    '',
  );
  protected readonly textoDeEncerrar = computed(() => {
    const hora = this.saidaEscolhida() || '…';
    return this.faltaSair() === 1
      ? `Marcar saída às ${hora} para 1 pessoa que não saiu? Ela vai assinar no papel.`
      : `Marcar saída às ${hora} para ${this.faltaSair()} pessoas que não saíram? Elas vão assinar no papel.`;
  });

  /** "Adesão 08 · Função 222 · EPI: sim · 19:30 às 20:45 · assinou no app" ou "não marcou presença". */
  protected resumo(pessoa: PessoaCompleta): string {
    if (!pessoa.entrada) return 'não marcou presença';
    const epi = pessoa.recebeuEpi === null ? null : `EPI: ${pessoa.recebeuEpi ? 'sim' : 'não'}`;
    const horario = pessoa.saida ? `${pessoa.entrada} às ${pessoa.saida}` : `chegou às ${pessoa.entrada}`;
    const assinatura = pessoa.assinadoEm ? 'assinou no app' : 'assina no papel';
    return [
      pessoa.numeroAdesao && `Adesão ${pessoa.numeroAdesao}`,
      pessoa.codigoFuncao && `Função ${pessoa.codigoFuncao}`,
      epi,
      horario,
      assinatura,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  /** No dia da limpeza, a hora de agora; numa limpeza passada, vazio (o organizador escolhe). */
  private horaSugerida(): string | null {
    return this.dia().data === hoje() ? horaAgora() : null;
  }

  protected abrir(pessoa: PessoaCompleta): void {
    this.emCorrecao.set(pessoa);
    this.formulario.reset({
      nome: null,
      telefone: null,
      numeroAdesao: pessoa.numeroAdesao,
      codigoFuncao: pessoa.codigoFuncao,
      recebeuEpi: paraSimNao(pessoa.recebeuEpi),
      entrada: pessoa.entrada ?? this.horaSugerida(),
      saida: pessoa.saida,
    });
    this.janelaDaPessoa.set(true);
  }

  protected abrirNova(): void {
    this.emCorrecao.set(null);
    this.formulario.reset({ entrada: this.horaSugerida() });
    this.janelaDaPessoa.set(true);
  }

  protected abrirEncerrar(): void {
    this.formularioDeEncerrar.reset({ saida: this.horaSugerida() ?? '' });
    this.janelaDeEncerrar.set(true);
  }

  /**
   * Se o esquema aceitou, devolve a função que envia os dados conferidos; se não, mostra os erros embaixo dos
   * campos e devolve null.
   */
  private conferir<T>(
    conferido: { success: true; data: T } | { success: false; error: Parameters<typeof errosPorCampo>[0] },
    enviar: (dados: T) => Promise<DiaCompleto>,
  ): (() => Promise<DiaCompleto>) | null {
    if (conferido.success) return () => enviar(conferido.data);
    mostrarErrosNosCampos(this.formulario, errosPorCampo(conferido.error));
    return null;
  }

  /** Corrige (L8) ou cadastra (L14), com a mesma validação do servidor antes de enviar. */
  protected async salvar(desfazerAssinatura = false): Promise<void> {
    const valores = this.formulario.getRawValue();
    const presenca = {
      numeroAdesao: valores.numeroAdesao,
      codigoFuncao: valores.codigoFuncao,
      recebeuEpi: deSimNao(valores.recebeuEpi),
      entrada: valores.entrada,
      saida: valores.saida,
    };
    const pessoa = this.emCorrecao();
    const dia = this.dia();
    // A mesma validação do servidor; o que vai para a API é o resultado já conferido pelo esquema.
    const enviar = pessoa
      ? this.conferir(esquemaCorrecaoPresenca.safeParse({ ...presenca, desfazerAssinatura }), (dados) =>
          this.limpezas
            .corrigirPresenca(dia, pessoa, dados)
            .then((corrigida) => ({ ...dia, pessoas: dia.pessoas.map((p) => (p.id === corrigida.id ? corrigida : p)) })),
        )
      : this.conferir(
          esquemaPessoaNaPresenca.safeParse({ ...presenca, nome: valores.nome, telefone: valores.telefone }),
          (dados) => this.limpezas.adicionarNaPresenca(dia, dados).then((nova) => ({ ...dia, pessoas: [...dia.pessoas, nova] })),
        );
    if (!enviar) return;
    this.salvando.set(true);
    try {
      this.mudou.emit(await enviar());
      this.janelaDaPessoa.set(false);
    } catch (erro) {
      if (erro instanceof FalhaNaApi && erro.dados.campos) mostrarErrosNosCampos(this.formulario, erro.dados.campos);
      else this.notificacoes.erro(mensagemDaFalha(erro));
    } finally {
      this.salvando.set(false);
    }
  }

  /** L13. "Alguém chegou depois dessa hora" (HORARIO_INVALIDO) aparece embaixo do campo de hora. */
  protected async encerrar(): Promise<void> {
    const saida = this.formularioDeEncerrar.controls.saida.value;
    if (!saida) {
      mostrarErrosNosCampos(this.formularioDeEncerrar, { saida: MENSAGENS.horaObrigatoria });
      return;
    }
    this.salvando.set(true);
    try {
      this.mudou.emit(await this.limpezas.encerrar(this.dia(), saida));
      this.janelaDeEncerrar.set(false);
    } catch (erro) {
      mostrarErrosNosCampos(this.formularioDeEncerrar, { saida: mensagemDaFalha(erro) });
    } finally {
      this.salvando.set(false);
    }
  }
}
