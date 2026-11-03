/**
 * As linhas da folha de presença: só quem veio (tem entrada), em ordem de chegada, e linhas em branco (com o
 * dia do mês já escrito, como na folha de papel) até completar o mínimo, para quem assinar à mão.
 */
import { dataEHoraCurtas, type DiaCompleto } from '@limpeza/compartilhado';

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
