/**
 * "/confirmar?dia=ID": formulário "Confirmar presença" (TelaConfirmar; regras C1–C8 e P3).
 * - "Qual sexta?" mostra só as sextas com vaga (C6); com ?dia=ID, ela já vem escolhida.
 * - Erro de formulário: aviso no topo E mensagem embaixo do campo. Erro de conexão: notificação.
 * - Deu certo: volta para o início com a notificação "Presença confirmada para …" (C8).
 */
import { Component, computed, effect, inject, input, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  dataPorExtenso, esquemaConfirmacao, TEMPOS, TEXTO_DO_TEMPO, vagasLivres, type Tempo,
} from '@limpeza/compartilhado';
import {
  AcoesDoFormulario, Aviso, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, Entrada, Escolhas, Formulario,
  LinhaDoFormulario, Notificacoes, Selecao, Vazio, type Opcao,
} from '@componentes';
import { mostrarErrosNosCampos, resumoDeErros, validadorZod, type AvisoDoFormulario } from '@formularios';
import { FalhaNaApi } from '@nucleo/api';
import { Escala } from '@nucleo/escala';
import { ehSemConexao, mensagemDaFalha, notificarFalha } from '@nucleo/falhas';
import { Estado } from '../../comum/estado/estado';

const MENSAGEM_DIA_OBRIGATORIO = 'Escolha a sexta.';

@Component({
  selector: 'app-tela-confirmar',
  imports: [
    AcoesDoFormulario, Aviso, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, Entrada, Escolhas, Estado,
    Formulario, LinhaDoFormulario, ReactiveFormsModule, RouterLink, Selecao, Vazio,
  ],
  template: `
    <div class="pagina">
      <app-estado
        [estado]="escala.estado()"
        [erro]="escala.erro()"
        textoCarregando="Carregando as sextas…"
        (tentar)="escala.carregar()"
      >
        @if (sextasComVaga().length > 0) {
          <form appFormulario class="card cartao-de-formulario" [formGroup]="formulario" (ngSubmit)="enviar()">
            <app-cabecalho-do-formulario titulo="Confirmar presença">
              <p class="form__desc">
                Escolha a sexta e conte como pode ajudar. Campos com <span class="form__required">*</span> são
                obrigatórios.
              </p>
            </app-cabecalho-do-formulario>

            @if (aviso(); as aviso) {
              <app-aviso tom="erro" [titulo]="aviso.titulo">{{ aviso.texto }}</app-aviso>
            }

            <div appLinhaDoFormulario>
              <app-campo rotulo="Seu nome" obrigatorio [controle]="formulario.controls.nome">
                <input appEntrada formControlName="nome" autocomplete="name" placeholder="Ex.: Andrei Gomes" />
              </app-campo>
              <app-campo
                rotulo="Telefone"
                obrigatorio
                dica="Só quem organiza vê seu telefone."
                [controle]="formulario.controls.telefone"
              >
                <input
                  appEntrada
                  formControlName="telefone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder="Ex.: 47 99999-9999"
                />
              </app-campo>
            </div>

            <app-campo rotulo="Qual sexta?" obrigatorio [controle]="formulario.controls.dia">
              <app-selecao formControlName="dia" [opcoes]="sextasComVaga()" textoInicial="Escolha uma sexta" />
            </app-campo>

            <app-escolhas legenda="Quanto tempo você pode ficar?" formControlName="tempo" [opcoes]="tempos" />

            <app-campo rotulo="Observação" [controle]="formulario.controls.observacao">
              <textarea appEntrada formControlName="observacao" placeholder="Ex.: vou levar o rodo novo"></textarea>
            </app-campo>

            <div appAcoesDoFormulario>
              <a appBotao variante="discreto" routerLink="/">Cancelar</a>
              <button appBotao type="submit" [esperando]="salvando()" [disabled]="salvando()">
                <app-conteudo-do-botao [esperando]="salvando()">Confirmar presença</app-conteudo-do-botao>
              </button>
            </div>
          </form>
        } @else {
          <div class="card">
            <app-vazio
              titulo="Nenhuma sexta com vaga"
              texto="As próximas sextas estão completas ou ainda não foram cadastradas."
            >
              <a appBotao variante="secundario" routerLink="/escala">Ver a escala</a>
            </app-vazio>
          </div>
        }
      </app-estado>
    </div>
  `,
})
export class TelaConfirmar implements OnInit {
  /** "?dia=ID" do endereço (withComponentInputBinding). */
  readonly dia = input<string>();

  protected readonly escala = inject(Escala);
  private readonly notificacoes = inject(Notificacoes);
  private readonly roteador = inject(Router);

  protected readonly tempos: Opcao[] = TEMPOS.map((tempo) => ({ valor: tempo, rotulo: TEXTO_DO_TEMPO[tempo] }));

  /** C6: só as sextas com vaga. */
  protected readonly sextasComVaga = computed<Opcao[]>(() =>
    this.escala
      .dias()
      .filter((dia) => vagasLivres(dia) > 0)
      .map((dia) => ({ valor: dia.id, rotulo: dataPorExtenso(dia.data) })),
  );

  protected readonly formulario = new FormGroup({
    nome: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaConfirmacao.shape.nome) }),
    telefone: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaConfirmacao.shape.telefone) }),
    dia: new FormControl<string | null>(null, {
      validators: (controle) => (controle.value ? null : { zod: MENSAGEM_DIA_OBRIGATORIO }),
    }),
    tempo: new FormControl<Tempo>('todo', { nonNullable: true }),
    observacao: new FormControl('', {
      nonNullable: true,
      validators: validadorZod(esquemaConfirmacao.shape.observacao),
    }),
  });

  protected readonly aviso = signal<AvisoDoFormulario | null>(null);
  protected readonly salvando = signal(false);

  constructor() {
    // C6: quando a escala chega, já escolhe a sexta do endereço (se tiver vaga) ou a primeira com vaga.
    effect(() => {
      const opcoes = this.sextasComVaga();
      const escolhida = this.formulario.controls.dia;
      if (opcoes.length === 0 || (escolhida.value && opcoes.some((opcao) => opcao.valor === escolhida.value))) return;
      const doEndereco = opcoes.find((opcao) => opcao.valor === this.dia());
      escolhida.setValue((doEndereco ?? opcoes[0])?.valor ?? null);
    });
  }

  ngOnInit(): void {
    void this.escala.carregar();
  }

  protected async enviar(): Promise<void> {
    this.formulario.markAllAsTouched();
    const comErro = Object.values(this.formulario.controls).filter((controle) => controle.invalid).length;
    if (comErro > 0) {
      this.aviso.set({ titulo: resumoDeErros(comErro), texto: 'Confira os campos marcados abaixo.' });
      return;
    }
    const dia = this.escala.buscar(this.formulario.controls.dia.value ?? '');
    if (!dia) return;

    this.aviso.set(null);
    this.salvando.set(true);
    try {
      const { nome, telefone, tempo, observacao } = this.formulario.getRawValue();
      await this.escala.confirmar(dia, { nome, telefone, tempo, observacao });
      await this.roteador.navigateByUrl('/');
    } catch (erro) {
      this.mostrarFalha(erro);
    } finally {
      this.salvando.set(false);
    }
  }

  /** Erros do servidor: no aviso do topo e, quando é de um campo, também embaixo dele. */
  private mostrarFalha(erro: unknown): void {
    if (ehSemConexao(erro)) {
      notificarFalha(this.notificacoes, erro, () => void this.enviar());
      return;
    }
    this.aviso.set({ titulo: mensagemDaFalha(erro) });
    if (!(erro instanceof FalhaNaApi)) return;
    const campos = { ...(erro.dados.campos ?? {}) };
    if (erro.codigo === 'TELEFONE_REPETIDO') campos['telefone'] = erro.message;
    mostrarErrosNosCampos(this.formulario, campos);
    // SEM_VAGA (C5): a sexta lotou nesse meio-tempo; a lista de sextas com vaga é atualizada.
    if (erro.codigo === 'SEM_VAGA') void this.escala.carregar();
  }
}
