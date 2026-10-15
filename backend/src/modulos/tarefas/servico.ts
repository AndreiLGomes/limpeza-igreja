/** Regras das tarefas (T1, T2, S5, S9). */
import type { Tarefa, TarefaEditada } from '@limpeza/shared';
import type { Transacao } from '../../banco/transacao.js';
import { ErroApp } from '../../comum/erros.js';
import { paraTarefa } from '../../comum/mapeadores.js';
import { exigirNaoPassada } from '../dias/exigir-nao-passada.js';
import * as repositorio from './repositorio.js';

/** T1: qualquer pessoa marca e desmarca. T2: só em sexta não passada. */
export async function marcar(diaId: string, tarefaId: string, feita: boolean): Promise<Tarefa> {
  const tarefa = await repositorio.buscarComData(diaId, tarefaId);
  exigirNaoPassada(tarefa, 'TAREFA_NAO_ENCONTRADA');
  return paraTarefa(await repositorio.marcar(tarefa.id, feita));
}

/**
 * Grava a lista de tarefas de uma sexta, na ordem recebida (usado ao criar e ao editar).
 * S9: tarefa com `id` continua a mesma (mantém "feita", mesmo se renomeada); sem `id` é nova;
 * a que existia e não veio é apagada. Um `id` que não é desta sexta é recusado.
 */
export async function salvarDoDia(tx: Transacao, diaId: string, lista: TarefaEditada[]): Promise<void> {
  const existentes = new Set((await repositorio.listarIdsDoDia(tx, diaId)).map((tarefa) => tarefa.id));
  const comOrdem = lista.map((tarefa, ordem) => ({ ...tarefa, ordem }));

  const mantidas = comOrdem.flatMap(({ id, nome, ordem }) => (id ? [{ id, nome, ordem }] : []));
  if (mantidas.some((tarefa) => !existentes.has(tarefa.id))) throw new ErroApp('TAREFA_NAO_ENCONTRADA');

  const idsMantidos = new Set(mantidas.map((tarefa) => tarefa.id));
  await repositorio.apagarVarias(tx, [...existentes].filter((id) => !idsMantidos.has(id)));
  await repositorio.renomearVarias(tx, mantidas);
  await repositorio.inserirVarias(
    tx,
    diaId,
    comOrdem.filter((tarefa) => !tarefa.id).map(({ nome, ordem }) => ({ nome, ordem })),
  );
}
