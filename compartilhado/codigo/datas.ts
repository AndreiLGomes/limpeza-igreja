/**
 * Datas e horas puras, sem fuso (D3): datas "AAAA-MM-DD" e horas "HH:MM".
 * Nada aqui sabe qual é "hoje": quem chama passa a data de hoje (no servidor, vem de comum/tempo.ts, D1).
 */
import { inicialMinuscula } from './textos.js';

const DIAS_DA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;

/** Nome do dia da semana, como aparece na tela ("Quinta"). */
export type DiaDaSemana = (typeof DIAS_DA_SEMANA)[number];

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const;

/** Formato de data aceito pela API. */
export const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Formato de hora aceito pela API (00:00 a 23:59). */
export const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function partesDaData(data: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = data.split('-').map(Number);
  return { ano: ano ?? NaN, mes: mes ?? NaN, dia: dia ?? NaN };
}

/** Dia da semana (0 = domingo) calculado em UTC, só para não depender do fuso do aparelho. */
function diaDaSemana(data: string): number {
  const { ano, mes, dia } = partesDaData(data);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/** true se "AAAA-MM-DD" existe no calendário (recusa "2026-02-30"). */
export function ehDataValida(data: string): boolean {
  if (!FORMATO_DATA.test(data)) return false;
  const { ano, mes, dia } = partesDaData(data);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** D4: "2026-10-16" → "Sexta, 16 de outubro". */
export function dataPorExtenso(data: string): string {
  const { mes, dia } = partesDaData(data);
  return `${DIAS_DA_SEMANA[diaDaSemana(data)]}, ${dia} de ${MESES[mes - 1]}`;
}

/** "2026-03-27" → "março" (o "Mês" da folha). */
export function mesPorExtenso(data: string): string {
  return MESES[partesDaData(data).mes - 1] ?? '';
}

/** A data por extenso no meio de uma frase: "2026-10-16" → "sexta, 16 de outubro". */
export function dataNaFrase(data: string): string {
  return inicialMinuscula(dataPorExtenso(data));
}

/** D4: "19:00" → "19h"; "19:30" → "19h30"; "07:05" → "7h05". */
export function hora(valor: string): string {
  const [h, m] = valor.split(':');
  const horas = Number(h);
  return m === '00' ? `${horas}h` : `${horas}h${m}`;
}

/** D4: "19h às 21h". */
export function horario(inicio: string, fim: string): string {
  return `${hora(inicio)} às ${hora(fim)}`;
}

/** "2026-10-16" + 7 → "2026-10-23" (aceita números negativos). */
export function somarDias(data: string, quantos: number): string {
  const { ano, mes, dia } = partesDaData(data);
  return new Date(Date.UTC(ano, mes - 1, dia + quantos)).toISOString().slice(0, 10);
}

/** O próximo dia da semana a partir da data (a própria data, se já for esse dia). Ex.: a próxima quinta. */
export function proximoDiaDaSemana(data: string, dia: DiaDaSemana): string {
  const faltam = (DIAS_DA_SEMANA.indexOf(dia) - diaDaSemana(data) + 7) % 7;
  return somarDias(data, faltam);
}

/** D2: passada é a data anterior a hoje. No próprio dia ela ainda é atual. */
export function ehPassada(data: string, hoje: string): boolean {
  return data < hoje;
}
