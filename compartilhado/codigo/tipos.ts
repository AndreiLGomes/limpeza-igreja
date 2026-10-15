/** Formatos que entram e saem da API (docs/04-api.md). */

/** Quanto tempo a pessoa pode ficar. */
export const TEMPOS = ['todo', 'primeira-hora'] as const;
export type Tempo = (typeof TEMPOS)[number];

/** Texto de cada tempo, para mostrar na tela. */
export const TEXTO_DO_TEMPO: Record<Tempo, string> = {
  todo: 'O tempo todo',
  'primeira-hora': 'Só a primeira hora',
};

/** Pessoa como a parte pública vê (P1, P2): sem telefone, sem observação. */
export interface PessoaPublica {
  id: string;
  nome: string;
  tempo: Tempo;
}

/** Pessoa como o organizador vê. */
export interface PessoaCompleta extends PessoaPublica {
  /** Formatado para exibir: "47 99999-1234". */
  telefone: string;
  observacao: string | null;
  /** Data e hora ISO. */
  criadoEm: string;
}

export interface Tarefa {
  id: string;
  nome: string;
  feita: boolean;
}

export interface DiaPublico {
  id: string;
  /** "2026-10-16" */
  data: string;
  /** "19:00" */
  inicio: string;
  /** "21:00" */
  fim: string;
  vagas: number;
  /** Em ordem de confirmação. */
  pessoas: PessoaPublica[];
  /** Em ordem (coluna `ordem`). */
  tarefas: Tarefa[];
}

export interface DiaCompleto extends Omit<DiaPublico, 'pessoas'> {
  pessoas: PessoaCompleta[];
}

/** Resposta de POST /dias/:id/confirmacoes. */
export interface ConfirmacaoCriada {
  pessoaId: string;
  codigoCancelamento: string;
}

/** Resposta de POST /organizador/entrar. */
export interface SessaoCriada {
  token: string;
  /** Data e hora ISO. */
  expiraEm: string;
}

/** Tons do StatusBadge do Design System. */
export type Tom = 'ok' | 'pendente' | 'faltando' | 'neutro';

export interface Status {
  tom: Tom;
  texto: string;
}
