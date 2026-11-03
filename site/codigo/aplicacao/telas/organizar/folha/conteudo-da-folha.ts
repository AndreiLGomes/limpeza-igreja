/**
 * O conteúdo da folha de presença, escrito uma vez só e usado pela tela (folha.ts) e pelo PDF (pdf-da-folha.ts):
 * título, campos do cabeçalho, colunas e linhas. As linhas são só de quem veio (tem entrada), em ordem de
 * chegada, e linhas em branco (com o dia do mês já escrito, como na folha de papel) até completar o mínimo,
 * para quem assinar à mão.
 */
import {
  dataEHoraCurtas, mesPorExtenso, TEXTO_DO_TIPO_DE_SERVICO, TIPOS_DE_SERVICO, type DiaCompleto,
} from '@limpeza/compartilhado';

export const TITULO_DA_FOLHA = "LISTA DE PRESENÇA – ENTREGA DE EPI's – FUNÇÕES DA MÃO DE OBRA";
export const LINHAS_MINIMAS = 15;

export interface LinhaDaFolha {
  dia: string;
  codigo: string;
  adesao: string;
  nome: string;
  /** X em "Sim" (true), em "Não" (false) ou em nenhum (null). */
  epi: boolean | null;
  entrada: string;
  saida: string;
  /** "Assinado no app em 03/11 às 19:32", ou vazio para assinar à mão. */
  assinatura: string;
}

/** Uma coluna da tabela; com `partes`, ela se divide em duas na segunda linha do cabeçalho. */
export interface ColunaDaFolha {
  titulo: string;
  partes?: readonly [string, string];
}

export const COLUNAS_DA_FOLHA: readonly ColunaDaFolha[] = [
  { titulo: 'Dia do Mês' },
  { titulo: 'Código da Função' },
  { titulo: 'Nº de Adesão' },
  { titulo: 'Voluntário – Nome' },
  { titulo: "EPI's Recebeu?", partes: ['Sim', 'Não'] },
  { titulo: 'Horário', partes: ['Entrada', 'Saída'] },
  { titulo: 'Assinatura' },
];

/** Posição da célula do nome em celulasDaLinha() (alinhada à esquerda). */
export const CELULA_DO_NOME = 3;

/** "Rótulo: valor" do cabeçalho da folha, na ordem da folha de papel. */
export function camposDoCabecalho(dia: Pick<DiaCompleto, 'data' | 'cabecalho'>): { rotulo: string; valor: string }[] {
  const { cabecalho } = dia;
  return [
    { rotulo: 'Casa de Oração nº (Relatório):', valor: cabecalho.casaDeOracao ?? '' },
    { rotulo: 'Local:', valor: cabecalho.local ?? '' },
    { rotulo: 'Administração/Setor:', valor: cabecalho.setor ?? '' },
    { rotulo: 'Mês:', valor: mesPorExtenso(dia.data) },
    { rotulo: 'Ano:', valor: dia.data.slice(0, 4) },
    { rotulo: 'Atividades:', valor: cabecalho.atividades ?? '' },
  ];
}

/** Os quadrinhos do tipo de serviço, com o escolhido marcado. */
export function quadrinhosDoServico(dia: Pick<DiaCompleto, 'cabecalho'>): { rotulo: string; marcado: boolean }[] {
  return TIPOS_DE_SERVICO.map((tipo) => ({
    rotulo: TEXTO_DO_TIPO_DE_SERVICO[tipo],
    marcado: dia.cabecalho.tipoDeServico === tipo,
  }));
}

/** O texto de cada célula da linha, na ordem de COLUNAS_DA_FOLHA (EPI e horário em duas células cada). */
export function celulasDaLinha(linha: LinhaDaFolha): string[] {
  return [
    linha.dia, linha.codigo, linha.adesao, linha.nome,
    linha.epi === true ? 'X' : '', linha.epi === false ? 'X' : '',
    linha.entrada, linha.saida, linha.assinatura,
  ];
}

export function linhasDaFolha(dia: Pick<DiaCompleto, 'data' | 'pessoas'>, minimo = LINHAS_MINIMAS): LinhaDaFolha[] {
  const vazia: LinhaDaFolha = {
    dia: dia.data.slice(8, 10), codigo: '', adesao: '', nome: '', epi: null, entrada: '', saida: '', assinatura: '',
  };
  const vieram = dia.pessoas
    .filter((pessoa) => pessoa.entrada)
    .sort((a, b) => (a.entrada ?? '').localeCompare(b.entrada ?? ''))
    .map((pessoa) => ({
      ...vazia,
      codigo: pessoa.codigoFuncao ?? '',
      adesao: pessoa.numeroAdesao ?? '',
      nome: pessoa.nome,
      epi: pessoa.recebeuEpi,
      entrada: pessoa.entrada ?? '',
      saida: pessoa.saida ?? '',
      assinatura: pessoa.assinadoEm ? `Assinado no app em ${dataEHoraCurtas(pessoa.assinadoEm)}` : '',
    }));
  return [...vieram, ...Array.from({ length: Math.max(0, minimo - vieram.length) }, () => vazia)];
}

/** "2026-11-03" → "folha-de-presenca-2026-11-03.pdf". */
export function nomeDoPdf(data: string): string {
  return `folha-de-presenca-${data}.pdf`;
}
