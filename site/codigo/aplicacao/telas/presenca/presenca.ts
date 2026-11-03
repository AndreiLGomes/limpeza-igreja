/**
 * "/presenca?dia=ID": o voluntário marca a própria presença, sem senha (TelaPresenca; L1–L9).
 * Três estados: formulário ("Cheguei" abre a janela "Confirmo", que marca a chegada e ASSINA, L5) →
 * chegou ("Saí" grava só a hora de saída, L6) → saiu.
 * O celular lembra telefone, adesão e código (L9); "Não sou eu" esquece. Fora do dia: estado vazio.
 * O campo Nome começa DESABILITADO: só quem não confirmou antes precisa dele, e só aparece quando o
 * servidor pede (NOME_OBRIGATORIO). Desabilitado, ele não deixa o formulário inválido.
 */
import { Component, computed, effect, inject, input, signal, untracked, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { dataPorExtenso, esquemaEntrada, hoje, MENSAGENS, mensagemDoErro, type Presenca } from '@limpeza/compartilhado';
import {
  AcoesDoFormulario, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, deSimNao, Entrada, Escolhas, Formulario,
  Janela, Notificacoes, OPCOES_SIM_NAO, Vazio,
} from '@componentes';
import { mostrarErrosNosCampos, validadorZod } from '@formularios';
import { Api, FalhaNaApi } from '@nucleo/api';
import { Escala } from '@nucleo/escala';
import { ehSemConexao, mensagemDaFalha, notificarFalha } from '@nucleo/falhas';
import { MinhaPresenca } from '@nucleo/minha-presenca';
import { Estado } from '../../comum/estado/estado';

/** Já saiu (pelo app em outro celular ou pelo "Encerrar limpeza"): a tela vai direto para "saiu", sem horários. */
const JA_SAIU: Presenca = { estado: 'saiu', primeiroNome: null, entrada: null, saida: null, assinadoEm: null };

@Component({
  selector: 'app-tela-presenca',
  imports: [
    AcoesDoFormulario, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, Entrada, Escolhas, Estado, Formulario,
    Janela, ReactiveFormsModule, RouterLink, Vazio,
  ],
  template: `
    <div class="pagina">
      <app-estado
        [estado]="escala.estado()"
        [erro]="escala.erro()"
        textoCarregando="Carregando a limpeza…"
        (tentar)="escala.carregar()"
      >
        @if (limpeza(); as limpeza) {
          @switch (presenca()?.estado) {
            @case ('saiu') {
              <div class="card">
                <app-vazio icone="calendar-check" titulo="Saída marcada" [texto]="textoDeSaida()">
                  <a appBotao variante="secundario" routerLink="/">Voltar ao início</a>
                </app-vazio>
              </div>
            }
            @case ('chegou') {
              <div class="card cartao-de-formulario">
                <app-cabecalho-do-formulario [titulo]="'Olá, ' + (presenca()?.primeiroNome ?? '')" [descricao]="titulo()" />
                @if (entrada(); as entrada) {
                  <p class="form__desc">Chegada assinada às {{ entrada }}.</p>
                }
                <div appAcoesDoFormulario>
                  <button appBotao variante="discreto" type="button" (click)="naoSouEu()">Não sou eu</button>
                  <button appBotao type="button" [esperando]="enviando()" [disabled]="enviando()" (click)="sair()">
                    <app-conteudo-do-botao [esperando]="enviando()" textoDeEspera="Marcando…">Saí</app-conteudo-do-botao>
                  </button>
                </div>
              </div>
            }
            @default {
              <form appFormulario class="card cartao-de-formulario" [formGroup]="formulario" (ngSubmit)="pedirConfirmacao()">
                <app-cabecalho-do-formulario titulo="Marcar presença" [descricao]="titulo()" />
                <app-campo
                  rotulo="Telefone"
                  obrigatorio
                  dica="O mesmo que você usou ao confirmar."
                  [controle]="formulario.controls.telefone"
                >
                  <input appEntrada type="tel" inputmode="tel" autocomplete="tel" placeholder="Ex.: 47 99999-9999" formControlName="telefone" />
                </app-campo>
                @if (pedirNome()) {
                  <app-campo rotulo="Seu nome" obrigatorio [dica]="dicaDoNome" [controle]="formulario.controls.nome">
                    <input appEntrada autocomplete="name" placeholder="Ex.: Andrei Gomes" formControlName="nome" />
                  </app-campo>
                }
                <app-campo rotulo="Nº de adesão" obrigatorio [controle]="formulario.controls.numeroAdesao">
                  <input appEntrada inputmode="numeric" placeholder="Ex.: 08" formControlName="numeroAdesao" />
                </app-campo>
                <app-campo rotulo="Código da função" obrigatorio [controle]="formulario.controls.codigoFuncao">
                  <input appEntrada inputmode="numeric" placeholder="Ex.: 222" formControlName="codigoFuncao" />
                </app-campo>
                <app-escolhas legenda="Recebeu EPI?" emLinha formControlName="recebeuEpi" [opcoes]="opcoesDeEpi" />
                <div appAcoesDoFormulario>
                  @if (minhaPresenca.dados()) {
                    <button appBotao variante="discreto" type="button" (click)="naoSouEu()">Não sou eu</button>
                  }
                  <button appBotao type="submit" [disabled]="enviando()">Cheguei</button>
                </div>
              </form>
            }
          }
        } @else {
          <div class="card">
            <app-vazio titulo="Hoje não tem limpeza" texto="A presença só pode ser marcada no dia da limpeza.">
              <a appBotao variante="secundario" routerLink="/escala">Ver a escala</a>
            </app-vazio>
          </div>
        }
      </app-estado>
    </div>

    <app-janela titulo="Confirmar sua chegada?" [(aberta)]="janelaDeChegada">
      <p class="dialog__text">{{ textoDaJanela() }}</p>
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaDeChegada.set(false)">Voltar</button>
        <button appBotao type="button" [esperando]="enviando()" [disabled]="enviando()" (click)="chegar()">
          <app-conteudo-do-botao [esperando]="enviando()" textoDeEspera="Assinando…">Confirmo</app-conteudo-do-botao>
        </button>
      </div>
    </app-janela>
  `,
})
export class TelaPresenca implements OnInit {
  /** "?dia=ID" do endereço (withComponentInputBinding). Sem ele, a próxima limpeza. */
  readonly dia = input<string>();

  protected readonly escala = inject(Escala);
  protected readonly minhaPresenca = inject(MinhaPresenca);
  private readonly api = inject(Api);
  private readonly notificacoes = inject(Notificacoes);

  protected readonly opcoesDeEpi = OPCOES_SIM_NAO;
  /**
   * L3: por que o campo Nome apareceu. Vai como dica (e não como erro do campo) porque, quando o campo entra
   * na tela, o Angular o liga ao formulário e roda a validação de novo, apagando um erro posto antes.
   */
  protected readonly dicaDoNome = mensagemDoErro('NOME_OBRIGATORIO');

  /** L1: só a limpeza de HOJE serve. */
  protected readonly limpeza = computed(() => {
    const id = this.dia();
    const dia = id ? this.escala.buscar(id) : this.escala.proximo();
    return dia && dia.data === hoje() ? dia : undefined;
  });
  protected readonly titulo = computed(() => {
    const dia = this.limpeza();
    return dia ? dataPorExtenso(dia.data) : '';
  });

  protected readonly presenca = signal<Presenca | null>(null);
  protected readonly pedirNome = signal(false);
  protected readonly enviando = signal(false);
  protected readonly janelaDeChegada = signal(false);
  /** L5: o que a pessoa está assinando (a chegada e o EPI). Montado ao abrir a janela. */
  protected readonly textoDaJanela = signal('');

  /** A hora de entrada: a que o servidor devolveu ou a que este celular guardou (L9). */
  protected readonly entrada = computed(() => {
    const dia = this.limpeza();
    return this.presenca()?.entrada ?? (dia ? this.minhaPresenca.entradaEm(dia.id) : null);
  });
  protected readonly textoDeSaida = computed(() => {
    const saida = this.presenca()?.saida;
    return saida ? `Saída marcada às ${saida}. Obrigado!` : 'Sua saída já está marcada. Obrigado!';
  });

  protected readonly formulario = new FormGroup({
    telefone: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaEntrada.shape.telefone) }),
    nome: new FormControl({ value: '', disabled: true }, { nonNullable: true, validators: validadorZod(esquemaEntrada.shape.nome) }),
    numeroAdesao: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaEntrada.shape.numeroAdesao) }),
    codigoFuncao: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaEntrada.shape.codigoFuncao) }),
    recebeuEpi: new FormControl<string | null>(null, {
      validators: (controle) => (controle.value ? null : { zod: MENSAGENS.epiObrigatorio }),
    }),
  });

  constructor() {
    // L9: quando a limpeza de hoje aparece, o que este celular lembra vem preenchido e a tela consulta o
    // estado UMA vez. Os dados ficam fora do rastreio (untracked): guardar os dados depois do "Cheguei"
    // não dispara outra consulta, que poderia chegar fora de ordem.
    effect(() => {
      const dia = this.limpeza();
      if (!dia) return;
      untracked(() => {
        const dados = this.minhaPresenca.dados();
        if (!dados) return;
        this.formulario.patchValue(dados);
        void this.consultar(dia.id, dados.telefone);
      });
    });
  }

  ngOnInit(): void {
    void this.escala.carregar();
  }

  private async consultar(diaId: string, telefone: string): Promise<void> {
    try {
      const presenca = await this.api.consultarPresenca(diaId, telefone);
      this.presenca.set(presenca.estado === 'fora' ? null : presenca);
    } catch {
      // Sem conexão ou erro: a pessoa ainda pode usar o formulário.
    }
  }

  /** "Cheguei": confere o formulário e abre a janela com o que a pessoa vai assinar (L5). */
  protected pedirConfirmacao(): void {
    this.formulario.markAllAsTouched();
    if (!this.limpeza() || this.formulario.invalid) return;
    const recebeu = deSimNao(this.formulario.controls.recebeuEpi.value);
    this.textoDaJanela.set(`Confirmo que cheguei à limpeza de hoje e que ${recebeu ? 'recebi' : 'não recebi'} EPI.`);
    this.janelaDeChegada.set(true);
  }

  /** "Confirmo": marca a chegada e assina (L5). */
  protected async chegar(): Promise<void> {
    const dia = this.limpeza();
    if (!dia) return;
    const { telefone, numeroAdesao, codigoFuncao, recebeuEpi } = this.formulario.getRawValue();
    const nome = this.formulario.controls.nome;
    this.enviando.set(true);
    try {
      const presenca = await this.api.marcarEntrada(dia.id, {
        telefone,
        numeroAdesao,
        codigoFuncao,
        recebeuEpi: deSimNao(recebeuEpi) ?? false,
        ...(nome.enabled ? { nome: nome.value } : {}),
      });
      this.minhaPresenca.guardarDados({ telefone, numeroAdesao, codigoFuncao });
      if (presenca.entrada) this.minhaPresenca.guardarEntrada(dia.id, presenca.entrada);
      this.presenca.set(presenca);
    } catch (erro) {
      this.mostrarFalha(erro, () => void this.chegar());
    } finally {
      this.janelaDeChegada.set(false);
      this.enviando.set(false);
    }
  }

  protected async sair(): Promise<void> {
    const dia = this.limpeza();
    if (!dia) return;
    this.enviando.set(true);
    try {
      this.presenca.set(await this.api.marcarSaida(dia.id, this.formulario.controls.telefone.value));
    } catch (erro) {
      this.mostrarFalha(erro, () => void this.sair());
    } finally {
      this.enviando.set(false);
    }
  }

  /** L9: celular compartilhado ou emprestado. */
  protected naoSouEu(): void {
    this.minhaPresenca.esquecer();
    this.presenca.set(null);
    this.mostrarNome(false);
    this.formulario.reset();
  }

  private mostrarNome(mostrar: boolean): void {
    const nome = this.formulario.controls.nome;
    this.pedirNome.set(mostrar);
    if (!mostrar) {
      nome.disable();
      return;
    }
    nome.enable();
    // O "Cheguei" marcou todos como tocados, inclusive o Nome escondido. Ao aparecer, ele volta a "não tocado"
    // para mostrar a dica (por que ele apareceu) em vez de "Digite seu nome." antes de a pessoa mexer nele.
    nome.markAsUntouched();
  }

  /**
   * Já saiu: vai direto para "saiu" (L7). Falta o nome: o campo aparece (L3). Erro de campo:
   * embaixo do campo. Sem conexão: notificação com "Tentar de novo". O resto: notificação.
   */
  private mostrarFalha(erro: unknown, tentarDeNovo: () => void): void {
    if (erro instanceof FalhaNaApi && erro.codigo === 'JA_SAIU') {
      this.presenca.set(JA_SAIU);
      return;
    }
    if (erro instanceof FalhaNaApi && erro.codigo === 'NOME_OBRIGATORIO') {
      this.mostrarNome(true);
      return;
    }
    if (erro instanceof FalhaNaApi && erro.dados.campos) {
      mostrarErrosNosCampos(this.formulario, erro.dados.campos);
      return;
    }
    if (ehSemConexao(erro)) {
      notificarFalha(this.notificacoes, erro, tentarDeNovo);
      return;
    }
    this.notificacoes.erro(mensagemDaFalha(erro));
  }
}
