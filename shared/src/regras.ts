/** Regras puras (docs/02-regras-de-negocio.md), usadas pelo front para mostrar e pelo back para garantir. */
import { ehPassada } from './datas.js';
import type { Status, Tarefa } from './tipos.js';

/**
 * O mínimo de um dia que as regras precisam. Serve para DiaPublico, DiaCompleto e para o servidor,
 * que pode passar só a contagem: { pessoas: { length: 3 } }.
 */
interface DiaComVagas {
  data: string;
  vagas: number;
  pessoas: { readonly length: number };
}

/** Quantas vagas ainda estão livres (nunca negativo). */
export function vagasLivres(dia: Pick<DiaComVagas, 'vagas' | 'pessoas'>): number {
  return Math.max(0, dia.vagas - dia.pessoas.length);
}

/** C3: só dá para confirmar em sexta não passada e com vaga livre. */
export function podeConfirmar(dia: DiaComVagas, hoje: string): boolean {
  return !ehPassada(dia.data, hoje) && vagasLivres(dia) > 0;
}

/** Etiqueta do card de uma sexta: "Ninguém confirmou", "Faltam N" ou "Completo". */
export function statusDoDia(dia: Pick<DiaComVagas, 'vagas' | 'pessoas'>): Status {
  if (dia.pessoas.length === 0) return { tom: 'missing', texto: 'Ninguém confirmou' };
  const faltam = vagasLivres(dia);
  if (faltam > 0) return { tom: 'pending', texto: `Faltam ${faltam}` };
  return { tom: 'ok', texto: 'Completo' };
}

/** T5: contador do card de tarefas, ex.: "1 de 4 feitas". */
export function contadorDeTarefas(tarefas: readonly Pick<Tarefa, 'feita'>[]): string {
  const feitas = tarefas.filter((tarefa) => tarefa.feita).length;
  return `${feitas} de ${tarefas.length} feitas`;
}

/** T5: etiqueta conforme as tarefas. Sexta sem tarefas não tem etiqueta (null). */
export function statusDasTarefas(tarefas: readonly Pick<Tarefa, 'feita'>[]): Status | null {
  if (tarefas.length === 0) return null;
  const feitas = tarefas.filter((tarefa) => tarefa.feita).length;
  if (feitas === 0) return { tom: 'neutral', texto: 'A fazer' };
  if (feitas === tarefas.length) return { tom: 'ok', texto: 'Limpeza feita' };
  return { tom: 'pending', texto: 'Em andamento' };
}
