/**
 * "/organizar/limpeza/nova" e "/organizar/limpeza/:id": criar ou editar uma limpeza (TelaNovaSexta).
 * - Ordem natural: quando → que horas → quantas pessoas → o que fazer.
 * - Nova: horários e vagas padrão (S3, S4) e as tarefas da limpeza mais recente (S7).
 * - A data pode ser qualquer dia da semana (S6).
 * - Editando: vagas abaixo dos confirmados mostram o erro e bloqueiam "Salvar" (S8).
 * - Cabeçalho da folha (L10): a nova vem com o padrão (L11); "Usar como padrão" guarda o desta limpeza.
 * - Editando: "Apagar limpeza" no fim, com janela dizendo quantas confirmações se perdem (S11).
 * A validação é o esquemaDia do compartilhado, o mesmo que o servidor usa.
 */
import { Component, computed, inject, input, signal, type OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CABECALHO_VAZIO, dataNaFrase, dataPorExtenso, errosPorCampo, esquemaCabecalho, esquemaDia, FIM_PADRAO, INICIO_PADRAO,
  mensagemDoErro, TEXTO_DO_TIPO_DE_SERVICO, TIPOS_DE_SERVICO, VAGAS_MAX, VAGAS_MIN, VAGAS_PADRAO, type Cabecalho,
  type DiaCompleto, type EntradaDia,
} from '@limpeza/compartilhado';
import {
  AcoesDoFormulario, Aviso, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, Contador, EditorDeTarefas, Entrada,
  Escolhas, estadoDoControle, Formulario, Icone, Janela, linhaDeTarefa, LinhaDoFormulario, Notificacoes,
  type LinhaDeTarefa, type Opcao,
} from '@componentes';
import { mostrarErrosNosCampos, resumoDeErros, validadorZod, type AvisoDoFormulario } from '@formularios';
import { FalhaNaApi } from '@nucleo/api';
import { ehSemConexao, mensagemDaFalha, notificarFalha } from '@nucleo/falhas';
import { Limpezas } from '@nucleo/limpezas';
import { Estado, type EstadoDaCarga } from '../../../comum/estado/estado';
import { ListaDePresenca } from './lista-de-presenca';

@Component({
  selector: 'app-tela-limpeza',
  imports: [
    AcoesDoFormulario, Aviso, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, Contador, EditorDeTarefas, Entrada,
    Escolhas, Estado, Formulario, Icone, Janela, LinhaDoFormulario, ListaDePresenca, ReactiveFormsModule, RouterLink,
  ],
  template: `
    <div class="pagina">
      <app-estado [estado]="estado()" [erro]="erro()" textoCarregando="Carregando a limpeza…" (tentar)="carregar()">
        <form appFormulario class="card cartao-de-formulario" [formGroup]="formulario" (ngSubmit)="salvar()">
          <app-cabecalho-do-formulario
            [titulo]="editando() ? 'Editar limpeza' : 'Nova limpeza'"
            [descricao]="descricao()"
          />

          @if (aviso(); as aviso) {
            <app-aviso tom="erro" [titulo]="aviso.titulo">{{ aviso.texto }}</app-aviso>
          }

          <app-campo rotulo="Data" obrigatorio [controle]="formulario.controls.data">
            <input appEntrada type="date" formControlName="data" />
          </app-campo>

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
            <app-aviso tom="erro" [titulo]="mensagemDeVagas()">Aumente as vagas ou remova alguém na lista de limpezas.</app-aviso>
          }

          <app-editor-de-tarefas legenda="Tarefas" [lista]="formulario.controls.tarefas" />

          <div class="form__head">
            <h2 class="subtitle">Cabeçalho da folha</h2>
            <p class="form__desc">Aparece no topo da folha de presença impressa. Tudo é opcional.</p>
          </div>
          <ng-container formGroupName="cabecalho">
            <app-campo rotulo="Casa de Oração nº" [controle]="formulario.controls.cabecalho.controls.casaDeOracao">
              <input appEntrada formControlName="casaDeOracao" />
            </app-campo>
            <app-campo rotulo="Local" [controle]="formulario.controls.cabecalho.controls.local">
              <input appEntrada formControlName="local" placeholder="Ex.: Taiti" />
            </app-campo>
            <app-campo rotulo="Administração/Setor" [controle]="formulario.controls.cabecalho.controls.setor">
              <input appEntrada formControlName="setor" />
            </app-campo>
            <app-campo rotulo="Atividades" [controle]="formulario.controls.cabecalho.controls.atividades">
              <input appEntrada formControlName="atividades" placeholder="Ex.: Limpeza" />
            </app-campo>
            <app-escolhas legenda="Tipo de serviço" formControlName="tipoDeServico" [opcoes]="tiposDeServico" />
          </ng-container>
          <app-escolhas legenda="Padrão" multipla formControlName="usarComoPadrao" [opcoes]="opcaoDePadrao" />

          <div appAcoesDoFormulario>
            <a appBotao variante="discreto" routerLink="/organizar">Cancelar</a>
            <button
              appBotao
              type="submit"
              [esperando]="salvando()"
              [disabled]="salvando() || vagasAbaixoDosConfirmados()"
            >
              <app-conteudo-do-botao [esperando]="salvando()">Salvar limpeza</app-conteudo-do-botao>
            </button>
          </div>
        </form>

        @if (dia(); as limpeza) {
          <app-lista-de-presenca [dia]="limpeza" (mudou)="trocarDia($event)" />
        }

        @if (editando()) {
          <div class="apagar">
            <button appBotao variante="perigo-discreto" type="button" (click)="janelaDeApagar.set(true)">
              <app-icone nome="trash-2" /> Apagar limpeza
            </button>
          </div>
        }
      </app-estado>
    </div>

    <app-janela titulo="Apagar esta limpeza?" [(aberta)]="janelaDeApagar">
      <p class="dialog__text">{{ textoDeApagar() }}</p>
      <div acoesDaJanela>
        <button appBotao variante="secundario" type="button" autofocus (click)="janelaDeApagar.set(false)">
          Manter limpeza
        </button>
        <button appBotao variante="perigo" type="button" [disabled]="salvando()" (click)="apagar()">Apagar limpeza</button>
      </div>
    </app-janela>
  `,
  styles: `
    /* "Apagar limpeza" fica no fim, separado do "Salvar" (TelaNovaSexta). */
    .apagar {
      display: flex;
      justify-content: center;
    }
  `,
})
export class TelaLimpeza implements OnInit {
  /** ":id" do endereço; sem ele, é uma limpeza nova. */
  readonly id = input<string>();

  private readonly limpezas = inject(Limpezas);
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
    // L10: "" é "Nenhum" no tipo de serviço; o esquema transforma vazio em null.
    cabecalho: new FormGroup({
      casaDeOracao: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaCabecalho.shape.casaDeOracao) }),
      local: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaCabecalho.shape.local) }),
      setor: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaCabecalho.shape.setor) }),
      atividades: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaCabecalho.shape.atividades) }),
      tipoDeServico: new FormControl('', { nonNullable: true }),
    }),
    usarComoPadrao: new FormControl<string[]>([], { nonNullable: true }),
  });

  protected readonly tiposDeServico: Opcao[] = [
    { valor: '', rotulo: 'Nenhum' },
    ...TIPOS_DE_SERVICO.map((tipo) => ({ valor: tipo, rotulo: TEXTO_DO_TIPO_DE_SERVICO[tipo] })),
  ];
  protected readonly opcaoDePadrao: Opcao[] = [{ valor: 'sim', rotulo: 'Usar como padrão nas próximas limpezas' }];

  protected readonly estado = signal<EstadoDaCarga>('carregando');
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<AvisoDoFormulario | null>(null);
  protected readonly salvando = signal(false);
  protected readonly janelaDeApagar = signal(false);
  /** A limpeza carregada (só na edição), para a lista de presença. */
  protected readonly dia = signal<DiaCompleto | null>(null);

  /** Data original e confirmados da limpeza que está sendo editada. */
  private readonly original = signal<{ data: string; confirmados: number } | null>(null);

  protected readonly editando = computed(() => Boolean(this.id()));

  private readonly vagas = estadoDoControle(() => this.formulario.controls.vagas, (controle) => controle.value, null);

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
    return `A limpeza de ${dataNaFrase(original.data)} sai da escala com as tarefas. ${confirmacoes} Não dá para desfazer.`;
  });

  ngOnInit(): void {
    void this.carregar();
  }

  protected async carregar(): Promise<void> {
    this.estado.set('carregando');
    try {
      const id = this.id();
      if (id) {
        const dia = await this.limpezas.buscar(id);
        this.dia.set(dia);
        this.formulario.patchValue({ data: dia.data, inicio: dia.inicio, fim: dia.fim, vagas: dia.vagas });
        this.trocarTarefas(dia.tarefas.map((tarefa) => linhaDeTarefa(tarefa.nome, tarefa.id)));
        this.trocarCabecalho(dia.cabecalho);
        this.original.set({ data: dia.data, confirmados: dia.pessoas.length });
      } else {
        // S7: é só uma sugestão; se não vier, o formulário começa sem tarefas.
        const nomes = await this.limpezas.sugestaoDeTarefas().catch(() => [] as string[]);
        this.trocarTarefas(nomes.map((nome) => linhaDeTarefa(nome)));
        // L11: a limpeza nova já vem com o cabeçalho padrão; se não vier, começa vazio.
        this.trocarCabecalho(await this.limpezas.cabecalhoPadrao().catch(() => CABECALHO_VAZIO));
      }
      this.estado.set('pronto');
    } catch (erro) {
      this.erro.set(mensagemDaFalha(erro));
      this.estado.set('erro');
    }
  }

  protected trocarDia(novo: DiaCompleto): void {
    this.dia.set(novo);
  }

  /** No formulário, vazio é "" (campo de texto em branco, "Nenhum" no tipo de serviço). */
  private trocarCabecalho(cabecalho: Cabecalho): void {
    this.formulario.controls.cabecalho.setValue({
      casaDeOracao: cabecalho.casaDeOracao ?? '',
      local: cabecalho.local ?? '',
      setor: cabecalho.setor ?? '',
      atividades: cabecalho.atividades ?? '',
      tipoDeServico: cabecalho.tipoDeServico ?? '',
    });
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
      cabecalho: valor.cabecalho,
      usarComoPadrao: valor.usarComoPadrao.includes('sim'),
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
      if (id) await this.limpezas.editar(id, this.entrada());
      else await this.limpezas.criar(this.entrada());
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
      await this.limpezas.apagar(id);
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
    // O que não tem campo próprio (ex.: tarefa repetida ou longa demais) vai no texto do aviso.
    const outros = mostrarErrosNosCampos(this.formulario, campos).filter(Boolean);
    const quantos = Object.keys(campos).length;
    const textoDosCampos = quantos > outros.length ? 'Confira os campos marcados abaixo.' : '';
    this.aviso.set({
      titulo: titulo ?? resumoDeErros(quantos),
      texto: [...outros, textoDosCampos].filter(Boolean).join(' '),
    });
  }

  private mostrarFalha(erro: unknown): void {
    if (ehSemConexao(erro)) {
      notificarFalha(this.notificacoes, erro, () => void this.salvar());
      return;
    }
    if (!(erro instanceof FalhaNaApi)) {
      this.aviso.set({ titulo: mensagemDaFalha(erro) });
      return;
    }
    const campos: Record<string, string> = { ...(erro.dados.campos ?? {}) };
    if (erro.codigo === 'DATA_REPETIDA' || erro.codigo === 'LIMPEZA_PASSADA') campos['data'] = erro.message;
    if (erro.codigo === 'VAGAS_MENOR_QUE_CONFIRMADOS') campos['vagas'] = erro.message;
    if (Object.keys(campos).length > 0) this.mostrarErros(campos, erro.message);
    else this.aviso.set({ titulo: erro.message });
  }
}
