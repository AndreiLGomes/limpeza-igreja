/**
 * Catálogo de erros da API (docs/04-api.md): código → status HTTP + mensagem pronta para mostrar.
 * É a única fonte das mensagens de erro: o servidor usa para responder e o site para exibir.
 */

interface ItemDoCatalogo {
  status: number;
  mensagem: string | ((extras: Record<string, unknown>) => string);
}

export const CATALOGO_DE_ERROS = {
  DADOS_INVALIDOS: {
    status: 400,
    mensagem: 'Confira os campos marcados.',
  },
  SESSAO_EXPIRADA: {
    status: 401,
    mensagem: 'Entre de novo na área de quem organiza.',
  },
  SENHA_INCORRETA: {
    status: 401,
    mensagem: 'Senha incorreta. Peça a senha para quem administra o app.',
  },
  ROTA_NAO_ENCONTRADA: {
    status: 404,
    mensagem: 'Esse endereço não existe.',
  },
  DIA_NAO_ENCONTRADO: {
    status: 404,
    mensagem: 'Essa limpeza não foi encontrada. Ela pode ter sido apagada.',
  },
  TAREFA_NAO_ENCONTRADA: {
    status: 404,
    mensagem: 'Essa tarefa não foi encontrada. Ela pode ter sido apagada.',
  },
  PESSOA_NAO_ENCONTRADA: {
    status: 404,
    mensagem: 'Essa pessoa não está mais na escala desta limpeza.',
  },
  CODIGO_INVALIDO: {
    status: 404,
    mensagem: 'Essa presença já tinha sido cancelada.',
  },
  TELEFONE_NAO_CONFERE: {
    status: 404,
    mensagem: 'Esse telefone não confere com nenhuma confirmação desta limpeza.',
  },
  LIMPEZA_PASSADA: {
    status: 409,
    mensagem: 'Essa limpeza já passou e não pode mais ser mudada.',
  },
  SEM_VAGA: {
    status: 409,
    mensagem: 'As vagas desta limpeza acabaram.',
  },
  TELEFONE_REPETIDO: {
    status: 409,
    mensagem: 'Esse telefone já está confirmado nesta limpeza.',
  },
  DATA_REPETIDA: {
    status: 409,
    mensagem: 'Já existe uma limpeza cadastrada nessa data.',
  },
  VAGAS_MENOR_QUE_CONFIRMADOS: {
    status: 409,
    mensagem: (extras) => {
      const confirmados = Number(extras['confirmados']);
      const pessoas = confirmados === 1 ? '1 pessoa confirmou' : `${confirmados} pessoas confirmaram`;
      return `Já ${pessoas}. As vagas não podem ser menos que isso.`;
    },
  },
  NOME_OBRIGATORIO: {
    status: 400,
    mensagem: 'Você ainda não está na lista desta limpeza. Escreva seu nome.',
  },
  NAO_E_HOJE: {
    status: 409,
    mensagem: 'A presença só pode ser marcada no dia da limpeza.',
  },
  JA_SAIU: {
    status: 409,
    mensagem: 'Sua saída já foi marcada. Para mudar algo, fale com quem organiza.',
  },
  SEM_ENTRADA: {
    status: 409,
    mensagem: 'Marque a chegada antes da saída.',
  },
  PRESENCA_MARCADA: {
    status: 409,
    mensagem: 'Essa pessoa já marcou presença. Para tirá-la da lista, apague a entrada em "Corrigir presença" primeiro.',
  },
  HORARIO_INVALIDO: {
    status: 409,
    mensagem: (extras) => {
      const pessoas = (extras['pessoas'] ?? []) as { nome: string; entrada: string }[];
      const [unica] = pessoas;
      if (pessoas.length === 1 && unica) return `${unica.nome} chegou às ${unica.entrada}, depois dessa hora.`;
      if (pessoas.length === 0) return 'Alguém chegou depois dessa hora.';
      const nomes = new Intl.ListFormat('pt-BR').format(pessoas.map((p) => `${p.nome} (${p.entrada})`));
      return `${nomes} chegaram depois dessa hora.`;
    },
  },
  MUITAS_TENTATIVAS: {
    status: 429,
    mensagem: 'Muitas tentativas erradas. Espere um pouco e tente de novo.',
  },
  ERRO_INTERNO: {
    status: 500,
    mensagem: 'Algo deu errado. Tente de novo em instantes.',
  },
  /** Só no site: o servidor não respondeu. Não tem status HTTP. */
  SEM_CONEXAO: {
    status: 0,
    mensagem: 'Sem conexão. Não foi possível falar com o servidor.',
  },
} as const satisfies Record<string, ItemDoCatalogo>;

export type CodigoDeErro = keyof typeof CATALOGO_DE_ERROS;

/** Formato de erro que a API sempre devolve (docs/04-api.md). */
export interface ErroApi {
  codigo: CodigoDeErro;
  mensagem: string;
  /** Só em erro de validação (400): nome do campo → mensagem. */
  campos?: Record<string, string>;
  /** Dados extras de alguns erros, ex.: `confirmados` (S8) e `tentarEmSegundos` (429). */
  [extra: string]: unknown;
}

export function ehCodigoDeErro(valor: unknown): valor is CodigoDeErro {
  return typeof valor === 'string' && Object.hasOwn(CATALOGO_DE_ERROS, valor);
}

export function statusDoErro(codigo: CodigoDeErro): number {
  return CATALOGO_DE_ERROS[codigo].status;
}

export function mensagemDoErro(codigo: CodigoDeErro, extras: Record<string, unknown> = {}): string {
  const { mensagem } = CATALOGO_DE_ERROS[codigo] as ItemDoCatalogo;
  return typeof mensagem === 'function' ? mensagem(extras) : mensagem;
}
