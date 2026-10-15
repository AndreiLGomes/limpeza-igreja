/**
 * /design-system: vitrine com todos os componentes de @ui, para conferir o visual a 375px nos
 * dois temas (Etapa 6 do docs/08). Os dados são de exemplo; nada aqui fala com o servidor.
 */
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  esquemaConfirmacao, esquemaDia, statusDasTarefas, TEXTO_DO_TEMPO, TEMPOS, VAGAS_MAX, VAGAS_MIN, VAGAS_PADRAO,
  type PessoaCompleta,
} from '@limpeza/shared';
import { resumoDeErros, validadorZod } from '@forms';
import {
  Alert, AppBar, Avatar, AvatarStack, Button, Card, ChecklistItem, ChoiceGroup, Dialog, EmptyState, Field, Footer,
  FormActions, FormDirective, FormHeader, FormRow, Icon, Input, linhaDeTarefa, Loading, PersonList, Select, Spinner,
  StatusBadge, Stepper, TaskEditor, ToastService, Wordmark, type Opcao,
} from '@ui';
import { Estado } from '../../shared/estado/estado';

const PESSOAS: PessoaCompleta[] = [
  { id: '1', nome: 'Andrei Gomes', tempo: 'todo', telefone: '47 90000-0001', observacao: null, criadoEm: '' },
  { id: '2', nome: 'João Silva', tempo: 'primeira-hora', telefone: '47 90000-0002', observacao: null, criadoEm: '' },
  {
    id: '3', nome: 'Maria Rocha', tempo: 'todo', telefone: '47 90000-0003',
    observacao: 'vou levar o rodo novo', criadoEm: '',
  },
];

@Component({
  selector: 'app-design-system',
  imports: [
    Alert, AppBar, Avatar, AvatarStack, Button, Card, ChecklistItem, ChoiceGroup, Dialog, EmptyState, Estado, Field,
    Footer, FormActions, FormDirective, FormHeader, FormRow, Icon, Input, Loading, PersonList, ReactiveFormsModule,
    Select, Spinner, StatusBadge, Stepper, TaskEditor, Wordmark,
  ],
  templateUrl: './design-system.html',
  styleUrl: './design-system.scss',
})
export class DesignSystem {
  private readonly toast = inject(ToastService);

  protected readonly links = [
    { rotulo: 'Esta semana', rota: '/' },
    { rotulo: 'Escala', rota: '/escala' },
    { rotulo: 'Vitrine', rota: '/design-system' },
  ];

  protected readonly pessoas = PESSOAS;
  protected readonly nomes = PESSOAS.map((pessoa) => pessoa.nome);

  protected readonly tarefas = signal([
    { nome: 'Varrer o salão', feita: true },
    { nome: 'Limpar os banheiros', feita: false },
    { nome: 'Passar pano nos bancos', feita: false },
    { nome: 'Tirar o lixo', feita: false },
  ]);
  protected readonly statusDasTarefas = () => statusDasTarefas(this.tarefas());

  protected marcar(indice: number, feita: boolean): void {
    this.tarefas.update((lista) => lista.map((tarefa, i) => (i === indice ? { ...tarefa, feita } : tarefa)));
  }

  // ---------- Formulário de exemplo, com as validações do shared ----------

  protected readonly sextas: Opcao[] = [
    { value: '2026-10-16', label: 'Sexta, 16 de outubro' },
    { value: '2026-10-23', label: 'Sexta, 23 de outubro' },
    { value: '2026-10-30', label: 'Sexta, 30 de outubro' },
  ];
  protected readonly tempos: Opcao[] = TEMPOS.map((tempo) => ({ value: tempo, label: TEXTO_DO_TEMPO[tempo] }));
  protected readonly vagasMin = VAGAS_MIN;
  protected readonly vagasMax = VAGAS_MAX;

  protected readonly form = new FormGroup({
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
    this.form.markAllAsTouched();
    const comErro = Object.values(this.form.controls).filter((controle) => controle.invalid).length;
    this.resumo.set(comErro ? resumoDeErros(comErro) : null);
    if (comErro) return;
    this.salvando.set(true);
    setTimeout(() => {
      this.salvando.set(false);
      this.toast.show('Presença confirmada para sexta, 16 de outubro.');
    }, 1500);
  }

  // ---------- Retorno ----------

  protected readonly janelaAberta = signal(false);

  protected mostrarToast(): void {
    this.toast.show('Tarefa marcada como feita.', {
      action: 'Desfazer',
      onAction: () => this.toast.show('Marcação desfeita.'),
    });
  }

  protected mostrarErro(): void {
    this.toast.error('Sem conexão. Não foi possível salvar.', { action: 'Tentar de novo', onAction: () => {} });
  }

  protected removerPessoa(pessoa: PessoaCompleta): void {
    this.toast.show(`${pessoa.nome} seria removido(a) da escala (só exemplo).`);
  }
}
