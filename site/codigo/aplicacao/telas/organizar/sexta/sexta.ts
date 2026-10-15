/**
 * "/organizar/sexta/nova" e "/organizar/sexta/:id": criar ou editar uma sexta (TelaNovaSexta).
 * - Ordem natural: quando → que horas → quantas pessoas → o que fazer.
 * - Nova: horários e vagas padrão (S3, S4) e as tarefas da sexta mais recente (S7).
 * - Data que não é sexta-feira: aviso, mas deixa salvar (S6).
 * - Editando: vagas abaixo dos confirmados mostram o erro e bloqueiam "Salvar" (S8).
 * - Editando: "Apagar sexta" no fim, com janela dizendo quantas confirmações se perdem (S11).
 * A validação é o esquemaDia do compartilhado, o mesmo que o servidor usa.
 */
import { Component, computed, inject, input, signal, type OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  dataNaFrase, dataPorExtenso, ehDataValida, ehSexta, errosPorCampo, esquemaDia, FIM_PADRAO, INICIO_PADRAO,
  mensagemDoErro, VAGAS_MAX, VAGAS_MIN, VAGAS_PADRAO, type EntradaDia,
} from '@limpeza/compartilhado';
import {
  AcoesDoFormulario, Aviso, Botao, CabecalhoDoFormulario, Campo, Contador, EditorDeTarefas, Entrada,
  estadoDoControle, Formulario, Girando, Icone, Janela, linhaDeTarefa, LinhaDoFormulario, Notificacoes,
  type LinhaDeTarefa,
} from '@componentes';
import { resumoDeErros, validadorZod } from '@formularios';
import { FalhaNaApi } from '@nucleo/api';
import { Sextas } from '@nucleo/sextas';
import { Estado, type EstadoDaCarga } from '../../../comum/estado/estado';

interface AvisoDoFormulario {
  titulo: string;
  texto?: string;
}

/** Campos do formulário que recebem erro do esquema ou do servidor. */
const CAMPOS = ['data', 'inicio', 'fim', 'vagas'] as const;

@Component({
  selector: 'app-tela-sexta',
  imports: [
    AcoesDoFormulario, Aviso, Botao, CabecalhoDoFormulario, Campo, Contador, EditorDeTarefas, Entrada, Estado,
    Formulario, Girando, Icone, Janela, LinhaDoFormulario, ReactiveFormsModule, RouterLink,
  ],
  template: `
    <div class="pagina">
      <app-estado [estado]="estado()" [erro]="erro()" textoCarregando="Carregando a sexta…" (tentar)="carregar()">
        <form appFormulario class="card cartao-de-formulario" [formGroup]="formulario" (ngSubmit)="salvar()">
          <app-cabecalho-do-formulario
            [titulo]="editando() ? 'Editar sexta' : 'Nova sexta'"
            [descricao]="descricao()"
          />

          @if (aviso(); as aviso) {
            <app-aviso tom="erro" [titulo]="aviso.titulo">{{ aviso.texto }}</app-aviso>
          }

          <app-campo rotulo="Data" obrigatorio [controle]="formulario.controls.data">
            <input appEntrada type="date" formControlName="data" />
          </app-campo>
          @if (naoEhSexta()) {
            <app-aviso titulo="Essa data não é uma sexta-feira.">Pode salvar assim mesmo, se for uma limpeza extra.</app-aviso>
          }

          <div appLinhaDoFormulario>
            <app-campo rotulo="Começa às" obrigatorio [controle]="formulario.controls.inicio">
              <input appEntrada type="time" formControlName="inicio" />
            </app-campo>
            <app-campo rotulo="Termina às" obrigatorio [controle]="formulario.controls.fim">
              <input appEntrada type="time" formControlName="fim" />
            </app-campo>
          </div>

          <app-campo rotulo="Vagas" obrigatorio dica="Quantas pessoas são necessárias." [controle]="formulario.controls.vagas">
            <app-contador formControlName="vagas" [minimo]="vagasMinimo" [maximo]="vagasMaximo" unidade="vagas" />
          </app-campo>
          @if (vagasAbaixoDosConfirmados()) {
            <app-aviso tom="erro" [titulo]="mensagemDeVagas()">Aumente as vagas ou remova alguém na lista de sextas.</app-aviso>
          }

          <app-editor-de-tarefas legenda="Tarefas" [lista]="formulario.controls.tarefas" />

          <div appAcoesDoFormulario>
            <a appBotao variante="discreto" routerLink="/organizar">Cancelar</a>
            <button
              appBotao
              type="submit"
              [disabled]="salvando() || vagasAbaixoDosConfirmados()"
              [attr.aria-busy]="salvando()"
            >
              @if (salvando()) {
                <app-girando /> Salvando…
              } @else {
                Salvar sexta
              }
            </button>
          </div>
        </form>

        @if (editando()) {
          <div class="apagar">
            <button appBotao variante="perigo-discreto" type="button" (click)="janelaDeApagar.set(true)">
              <app-icone nome="trash-2" /> Apagar sexta
            </button>
          </div>
        }
      </app-estado>
    </div>

    <app-janela titulo="Apagar esta sexta?" [(aberta)]="janelaDeApagar">
      <p class="dialog__text">{{ textoDeApagar() }}</p>
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaDeApagar.set(false)">
          Manter sexta
        </button>
        <button appBotao variante="perigo" type="button" [disabled]="salvando()" (click)="apagar()">Apagar sexta</button>
      </div>
    </app-janela>
  `,
  styles: `
    /* "Apagar sexta" fica no fim, separado do "Salvar" (TelaNovaSexta). */
    .apagar {
      display: flex;
      justify-content: center;
    }
  `,
})
export class TelaSexta implements OnInit {
  /** ":id" do endereço; sem ele, é uma sexta nova. */
  readonly id = input<string>();

  private readonly sextas = inject(Sextas);
  private readonly notificacoes = inject(Notificacoes);
  private readonly roteador = inject(Router);

  protected readonly vagasMinimo = VAGAS_MIN;
  protected readonly vagasMaximo = VAGAS_MAX;

  protected readonly formulario = new FormGroup({
    data: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaDia.shape.data) }),
    inicio: new FormControl(INICIO_PADRAO, { nonNullable: true, validators: validadorZod(esquemaDia.shape.inicio) }),
    fim: new FormControl(FIM_PADRAO, { nonNullable: true, validators: validadorZod(esquemaDia.shape.fim) }),
    vagas: new FormControl<number | null>(VAGAS_PADRAO, { validators: validadorZod(esquemaDia.shape.vagas) }),
    tarefas: new FormArray<LinhaDeTarefa>([]),
  });

  protected readonly estado = signal<EstadoDaCarga>('carregando');
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<AvisoDoFormulario | null>(null);
  protected readonly salvando = signal(false);
  protected readonly janelaDeApagar = signal(false);

  /** Data original e confirmados da sexta que está sendo editada. */
  private readonly original = signal<{ data: string; confirmados: number } | null>(null);

  protected readonly editando = computed(() => Boolean(this.id()));

  private readonly data = estadoDoControle(() => this.formulario.controls.data, (controle) => controle.value, '');
  private readonly vagas = estadoDoControle(() => this.formulario.controls.vagas, (controle) => controle.value, null);

  /** S6: a data é válida, mas não cai numa sexta-feira. */
  protected readonly naoEhSexta = computed(() => ehDataValida(this.data()) && !ehSexta(this.data()));

  /** S8: na edição, vagas abaixo do número de confirmados. */
  protected readonly vagasAbaixoDosConfirmados = computed(() => {
    const vagas = this.vagas();
    const confirmados = this.original()?.confirmados ?? 0;
    return vagas !== null && confirmados > 0 && vagas < confirmados;
  });

  protected readonly mensagemDeVagas = computed(() =>
    mensagemDoErro('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados: this.original()?.confirmados ?? 0 }),
  );

  protected readonly descricao = computed(() => {
    const original = this.original();
    return original ? dataPorExtenso(original.data) : 'Depois de salvar, ela aparece para todo mundo na escala.';
  });

  /** S11: a janela diz quantas confirmações serão perdidas. */
  protected readonly textoDeApagar = computed(() => {
    const original = this.original();
    if (!original) return '';
    const confirmacoes =
      original.confirmados === 0
        ? 'Ninguém confirmou presença nela.'
        : original.confirmados === 1
          ? 'A confirmação de 1 pessoa será perdida.'
          : `As confirmações de ${original.confirmados} pessoas serão perdidas.`;
    return `A sexta de ${dataNaFrase(original.data)} sai da escala com as tarefas. ${confirmacoes} Não dá para desfazer.`;
  });

  ngOnInit(): void {
    void this.carregar();
  }

  protected async carregar(): Promise<void> {
    this.estado.set('carregando');
    try {
      const id = this.id();
      if (id) {
        const dia = await this.sextas.buscar(id);
        this.formulario.patchValue({ data: dia.data, inicio: dia.inicio, fim: dia.fim, vagas: dia.vagas });
        this.trocarTarefas(dia.tarefas.map((tarefa) => linhaDeTarefa(tarefa.nome, tarefa.id)));
        this.original.set({ data: dia.data, confirmados: dia.pessoas.length });
      } else {
        // S7: é só uma sugestão; se não vier, o formulário começa sem tarefas.
        const nomes = await this.sextas.sugestaoDeTarefas().catch(() => [] as string[]);
        this.trocarTarefas(nomes.map((nome) => linhaDeTarefa(nome)));
      }
      this.estado.set('pronto');
    } catch (erro) {
      this.erro.set(erro instanceof FalhaNaApi ? erro.message : 'Algo deu errado. Tente de novo em instantes.');
      this.estado.set('erro');
    }
  }

  private trocarTarefas(linhas: LinhaDeTarefa[]): void {
    const lista = this.formulario.controls.tarefas;
    lista.clear();
    for (const linha of linhas) lista.push(linha);
  }

  /** O que vai para a API, montado do formulário. */
  private entrada(): EntradaDia {
    const valor = this.formulario.getRawValue();
    return {
      data: valor.data,
      inicio: valor.inicio,
      fim: valor.fim,
      vagas: valor.vagas ?? Number.NaN,
      tarefas: valor.tarefas.map((tarefa) => (tarefa.id ? { id: tarefa.id, nome: tarefa.nome } : { nome: tarefa.nome })),
    };
  }

  protected async salvar(): Promise<void> {
    this.formulario.markAllAsTouched();
    const resultado = esquemaDia.safeParse(this.entrada());
    if (!resultado.success) {
      this.mostrarErros(errosPorCampo(resultado.error));
      return;
    }
    this.aviso.set(null);
    this.salvando.set(true);
    try {
      const id = this.id();
      if (id) await this.sextas.editar(id, this.entrada());
      else await this.sextas.criar(this.entrada());
      await this.roteador.navigateByUrl('/organizar');
    } catch (erro) {
      this.mostrarFalha(erro);
    } finally {
      this.salvando.set(false);
    }
  }

  protected async apagar(): Promise<void> {
    const id = this.id();
    if (!id) return;
    this.salvando.set(true);
    try {
      await this.sextas.apagar(id);
      this.janelaDeApagar.set(false);
      await this.roteador.navigateByUrl('/organizar');
    } catch (erro) {
      this.janelaDeApagar.set(false);
      this.mostrarFalha(erro);
    } finally {
      this.salvando.set(false);
    }
  }

  /** Erros por campo (do esquema ou do servidor): embaixo do campo e resumo no aviso do topo. */
  private mostrarErros(campos: Record<string, string>, titulo?: string): void {
    const outros: string[] = [];
    for (const [campo, mensagem] of Object.entries(campos)) {
      const controle = CAMPOS.find((nome) => nome === campo);
      if (controle) this.formulario.controls[controle].setErrors({ servidor: mensagem });
      else outros.push(mensagem); // ex.: tarefa repetida ou longa demais
    }
    const quantos = Object.keys(campos).length;
    const textoDosCampos = quantos > outros.length ? 'Confira os campos marcados abaixo.' : '';
    this.aviso.set({
      titulo: titulo ?? resumoDeErros(quantos),
      texto: [...outros, textoDosCampos].filter(Boolean).join(' '),
    });
  }

  private mostrarFalha(erro: unknown): void {
    if (!(erro instanceof FalhaNaApi)) {
      this.aviso.set({ titulo: 'Algo deu errado. Tente de novo em instantes.' });
      return;
    }
    if (erro.codigo === 'SEM_CONEXAO') {
      this.notificacoes.erro(erro.message, { acao: 'Tentar de novo', aoAgir: () => void this.salvar() });
      return;
    }
    const campos: Record<string, string> = { ...(erro.dados.campos ?? {}) };
    if (erro.codigo === 'DATA_REPETIDA' || erro.codigo === 'SEXTA_PASSADA') campos['data'] = erro.message;
    if (erro.codigo === 'VAGAS_MENOR_QUE_CONFIRMADOS') campos['vagas'] = erro.message;
    if (Object.keys(campos).length > 0) this.mostrarErros(campos, erro.message);
    else this.aviso.set({ titulo: erro.message });
  }
}
