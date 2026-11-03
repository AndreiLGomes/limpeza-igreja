/**
 * /vitrine: mostra todos os componentes de @componentes, para conferir o visual a 375px nos
 * dois temas (Etapa 6 do docs/08). Os dados são de exemplo; nada aqui fala com o servidor.
 */
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  esquemaConfirmacao, esquemaDia, statusDasTarefas, TEXTO_DO_TEMPO, TEMPOS, VAGAS_MAX, VAGAS_MIN, VAGAS_PADRAO,
  type PessoaCompleta,
} from '@limpeza/compartilhado';
import { resumoDeErros, validadorZod } from '@formularios';
import {
  AcoesDoFormulario, Avatar, Aviso, Barra, Botao, CabecalhoDoFormulario, Campo, Carregando, Cartao, ConteudoDoBotao,
  Contador, EditorDeTarefas, Entrada, Escolhas, Etiqueta, Formulario, Girando, GrupoDeAvatares, Icone, ItemDeTarefa, Janela,
  LinhaDoFormulario, linhaDeTarefa, ListaDePessoas, Marca, Notificacoes, Rodape, Selecao, Vazio, type Opcao,
} from '@componentes';
import { Estado } from '../../comum/estado/estado';

/** Sem nada da lista de presença (ninguém chegou ainda). */
const SEM_PRESENCA = {
  numeroAdesao: null, codigoFuncao: null, recebeuEpi: null, entrada: null, saida: null, assinadoEm: null,
};

const PESSOAS: PessoaCompleta[] = [
  { id: '1', ...SEM_PRESENCA, nome: 'Andrei Gomes', tempo: 'todo', telefone: '47 90000-0001', observacao: null, criadoEm: '' },
  { id: '2', ...SEM_PRESENCA, nome: 'João Silva', tempo: 'primeira-hora', telefone: '47 90000-0002', observacao: null, criadoEm: '' },
  {
    id: '3', ...SEM_PRESENCA, nome: 'Maria Rocha', tempo: 'todo', telefone: '47 90000-0003',
    observacao: 'vou levar o rodo novo', criadoEm: '',
  },
];

@Component({
  selector: 'app-vitrine',
  imports: [
    AcoesDoFormulario, Avatar, Aviso, Barra, Botao, CabecalhoDoFormulario, Campo, Carregando, Cartao, ConteudoDoBotao,
    Contador, EditorDeTarefas, Entrada, Escolhas, Estado, Etiqueta, Formulario, Girando, GrupoDeAvatares, Icone, ItemDeTarefa,
    Janela, LinhaDoFormulario, ListaDePessoas, Marca, ReactiveFormsModule, Rodape, Selecao, Vazio,
  ],
  templateUrl: './vitrine.html',
  styleUrl: './vitrine.scss',
})
export class Vitrine {
  private readonly notificacoes = inject(Notificacoes);

  protected readonly abas = [
    { rotulo: 'Esta semana', rota: '/' },
    { rotulo: 'Escala', rota: '/escala' },
    { rotulo: 'Vitrine', rota: '/vitrine' },
  ];

  protected readonly pessoas = PESSOAS;
  protected readonly nomes = PESSOAS.map((pessoa) => pessoa.nome);

  protected readonly tarefas = signal([
    { nome: 'Varrer o salão', feita: true },
    { nome: 'Limpar os banheiros', feita: false },
    { nome: 'Passar pano nos bancos', feita: false },
    { nome: 'Tirar o lixo', feita: false },
  ]);
  protected readonly situacaoDasTarefas = () => statusDasTarefas(this.tarefas());
  protected readonly quantasFeitas = () => this.tarefas().filter((tarefa) => tarefa.feita).length;

  protected marcar(indice: number, feita: boolean): void {
    this.tarefas.update((lista) => lista.map((tarefa, i) => (i === indice ? { ...tarefa, feita } : tarefa)));
  }

  // ---------- Formulário de exemplo, com as validações do compartilhado ----------

  protected readonly limpezas: Opcao[] = [
    { valor: '2026-10-16', rotulo: 'Sexta, 16 de outubro' },
    { valor: '2026-10-23', rotulo: 'Sexta, 23 de outubro' },
    { valor: '2026-10-30', rotulo: 'Sexta, 30 de outubro' },
  ];
  protected readonly tempos: Opcao[] = TEMPOS.map((tempo) => ({ valor: tempo, rotulo: TEXTO_DO_TEMPO[tempo] }));
  protected readonly vagasMinimo = VAGAS_MIN;
  protected readonly vagasMaximo = VAGAS_MAX;

  protected readonly formulario = new FormGroup({
    nome: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaConfirmacao.shape.nome) }),
    telefone: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaConfirmacao.shape.telefone) }),
    dia: new FormControl<string | null>('2026-10-16'),
    tempo: new FormControl<string>('todo', { nonNullable: true }),
    observacao: new FormControl('', {
      nonNullable: true,
      validators: validadorZod(esquemaConfirmacao.shape.observacao),
    }),
    data: new FormControl('2026-10-30', { nonNullable: true, validators: validadorZod(esquemaDia.shape.data) }),
    inicio: new FormControl('19:00', { nonNullable: true }),
    fim: new FormControl('21:00', { nonNullable: true }),
    vagas: new FormControl<number | null>(VAGAS_PADRAO, { validators: validadorZod(esquemaDia.shape.vagas) }),
    tarefas: new FormArray([linhaDeTarefa('Varrer o salão', 'id-salvo'), linhaDeTarefa('Limpar os banheiros')]),
  });

  protected readonly resumo = signal<string | null>(null);
  protected readonly salvando = signal(false);

  protected enviar(): void {
    this.formulario.markAllAsTouched();
    const comErro = Object.values(this.formulario.controls).filter((controle) => controle.invalid).length;
    this.resumo.set(comErro ? resumoDeErros(comErro) : null);
    if (comErro) return;
    this.salvando.set(true);
    setTimeout(() => {
      this.salvando.set(false);
      this.notificacoes.mostrar('Presença confirmada para sexta, 16 de outubro.');
    }, 1500);
  }

  protected limpar(): void {
    this.formulario.reset();
    this.resumo.set(null);
  }

  // ---------- Retorno ----------

  protected readonly janelaAberta = signal(false);

  protected mostrarNotificacao(): void {
    this.notificacoes.mostrar('Tarefa marcada como feita.', {
      acao: 'Desfazer',
      aoAgir: () => this.notificacoes.mostrar('Marcação desfeita.'),
    });
  }

  protected mostrarErro(): void {
    this.notificacoes.erro('Sem conexão. Não foi possível salvar.', { acao: 'Tentar de novo', aoAgir: () => {} });
  }

  protected removerPessoa(pessoa: PessoaCompleta): void {
    this.notificacoes.mostrar(`${pessoa.nome} seria removido(a) da escala (só exemplo).`);
  }
}
