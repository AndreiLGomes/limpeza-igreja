/**
 * Os dados de exemplo, num lugar só: usados pelo comando "dados-de-exemplo" e pelos testes de ponta a ponta.
 * Os telefones são fictícios (4790000000X), nunca números reais.
 */
import { proximoDiaDaSemana, type DiaDaSemana, type Tempo } from '@limpeza/compartilhado';

/** O dia da semana das limpezas de exemplo (hoje, a limpeza da igreja é na quinta). */
export const DIA_DOS_EXEMPLOS: DiaDaSemana = 'Quinta';

export const QUANTAS_LIMPEZAS = 4;

export const TAREFAS_DE_EXEMPLO = ['Varrer o salão', 'Limpar os banheiros', 'Passar pano nos bancos', 'Tirar o lixo'];

export interface PessoaDeExemplo {
  nome: string;
  telefone: string;
  tempo: Tempo;
  observacao?: string;
}

/** Quem confirmou em cada limpeza, pela posição (0 = a primeira). */
export const PESSOAS_POR_LIMPEZA: PessoaDeExemplo[][] = [
  [
    { nome: 'Andrei Gomes', telefone: '47900000001', tempo: 'todo' },
    { nome: 'João Silva', telefone: '47900000002', tempo: 'primeira-hora' },
    { nome: 'Maria Rocha', telefone: '47900000003', tempo: 'todo', observacao: 'vou levar o rodo novo' },
  ],
  [{ nome: 'Paulo Souza', telefone: '47900000004', tempo: 'todo' }],
];

/** A data da primeira limpeza de exemplo: a próxima quinta a partir de hoje (a própria data, se for quinta). */
export function primeiraLimpezaDeExemplo(hojeEmSaoPaulo: string): string {
  return proximoDiaDaSemana(hojeEmSaoPaulo, DIA_DOS_EXEMPLOS);
}
