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
  /** Formatado para exibir: "47 99999-1234". Vazio só para quem o organizador cadastrou sem celular (L14). */
  telefone: string | null;
  observacao: string | null;
  /** Data e hora ISO. */
  criadoEm: string;
  /** Lista de presença (L4–L8). Tudo null enquanto a pessoa não chegou. */
  numeroAdesao: string | null;
  codigoFuncao: string | null;
  recebeuEpi: boolean | null;
  /** "19:32" */
  entrada: string | null;
  saida: string | null;
  /** Data e hora ISO da assinatura no app. Só o próprio voluntário assina (L6). */
  assinadoEm: string | null;
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

/** L12: em que pé está a presença de alguém na limpeza de hoje. */
export const ESTADOS_DA_PRESENCA = ['fora', 'chegou', 'assinou'] as const;
export type EstadoDaPresenca = (typeof ESTADOS_DA_PRESENCA)[number];

/**
 * Resposta dos endereços públicos da presença (L5, L6, L12). Os horários só vêm para quem acabou de
 * tocar em "Cheguei" pela primeira vez ou em "Saí"; no consultar, vêm null.
 */
export interface Presenca {
  estado: EstadoDaPresenca;
  /** Só o primeiro nome, para a pessoa conferir que é ela ("Olá, Célia"). */
  primeiroNome: string | null;
  entrada: string | null;
  saida: string | null;
  /** Data e hora ISO. */
  assinadoEm: string | null;
}
