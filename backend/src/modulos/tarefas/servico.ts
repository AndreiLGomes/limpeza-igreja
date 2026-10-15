/** Regras das tarefas (T1, T2). */
import type { Tarefa } from '@limpeza/shared';
import { paraTarefa } from '../../comum/mapeadores.js';
import { exigirNaoPassada } from '../dias/servico.js';
import * as repositorio from './repositorio.js';

/** T1: qualquer pessoa marca e desmarca. T2: só em sexta não passada. */
export async function marcar(diaId: string, tarefaId: string, feita: boolean): Promise<Tarefa> {
  const tarefa = await repositorio.buscarComData(diaId, tarefaId);
  exigirNaoPassada(tarefa, 'TAREFA_NAO_ENCONTRADA');
  return paraTarefa(await repositorio.marcar(tarefa.id, feita));
}
