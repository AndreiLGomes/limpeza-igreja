/** Regras das limpezas (S1–S13). */
import { ehPassada, ESCALA_MAX_DIAS, hoje, type DadosDia, type DiaCompleto, type DiaPublico } from '@limpeza/compartilhado';
import type { DiaComTudo } from '../../banco/esquema.js';
import { emTransacao } from '../../banco/transacao.js';
import { ErroDeRegra } from '../../comum/erros.js';
import { comRestricaoUnica } from '../../comum/erros-do-banco.js';
import { paraDiaCompleto, paraDiaPublico } from '../../comum/mapeadores.js';
import * as repositorioDeConfirmacoes from '../confirmacoes/repositorio.js';
import * as servicoDeTarefas from '../tarefas/servico.js';
import { exigirNaoPassada } from './exigir-nao-passada.js';
import * as repositorio from './repositorio.js';

/** S12, S13: as limpezas de hoje em diante, em ordem de data, no máximo 8. */
function proximasLimpezas(): Promise<DiaComTudo[]> {
  return repositorio.listarAPartirDe(hoje(), ESCALA_MAX_DIAS);
}

async function buscarOu404(id: string): Promise<DiaComTudo> {
  const dia = await repositorio.buscarCompleto(id);
  if (!dia) throw new ErroDeRegra('DIA_NAO_ENCONTRADO');
  return dia;
}

/** S2: a data repetida é recusada pelo banco (restrição única), também em edições simultâneas. */
function comDataUnica<T>(acao: () => Promise<T>): Promise<T> {
  return comRestricaoUnica('dias_data_unica', 'DATA_REPETIDA', acao);
}

// ---------- Parte pública ----------

export async function escalaPublica(): Promise<DiaPublico[]> {
  return (await proximasLimpezas()).map(paraDiaPublico);
}

export async function diaPublico(id: string): Promise<DiaPublico> {
  return paraDiaPublico(await buscarOu404(id));
}

// ---------- Organizador ----------

export async function limpezasDoOrganizador(): Promise<DiaCompleto[]> {
  return (await proximasLimpezas()).map(paraDiaCompleto);
}

export async function diaCompleto(id: string): Promise<DiaCompleto> {
  return paraDiaCompleto(await buscarOu404(id));
}

/** S7: nomes das tarefas da limpeza mais recente (mesmo que já tenha passada); vazio se não há limpezas. */
export async function sugestaoDeTarefas(): Promise<string[]> {
  const maisRecente = await repositorio.buscarMaisRecente();
  return maisRecente?.tarefas.map((tarefa) => tarefa.nome) ?? [];
}

/** S1–S5: cria a limpeza com as tarefas. */
export async function criar({ tarefas, ...campos }: DadosDia): Promise<DiaCompleto> {
  if (ehPassada(campos.data, hoje())) throw new ErroDeRegra('LIMPEZA_PASSADA');
  const id = await comDataUnica(() =>
    emTransacao(async (tx) => {
      const dia = await repositorio.inserir(tx, campos);
      await servicoDeTarefas.salvarDoDia(tx, dia.id, tarefas);
      return dia.id;
    }),
  );
  return diaCompleto(id);
}

/**
 * Edita a limpeza. S10: limpeza passada não pode ser editada. S1: nem ganhar uma data passada.
 * S8: vagas não podem ficar abaixo dos confirmados. S9: tarefas mantidas guardam "feita".
 * A linha fica travada durante a edição, para não correr junto com uma confirmação (C5).
 */
export async function editar(id: string, { tarefas, ...campos }: DadosDia): Promise<DiaCompleto> {
  await comDataUnica(() =>
    emTransacao(async (tx) => {
      exigirNaoPassada(await repositorio.buscarTravando(tx, id));
      if (ehPassada(campos.data, hoje())) throw new ErroDeRegra('LIMPEZA_PASSADA');

      const confirmados = await repositorioDeConfirmacoes.contarDoDia(tx, id);
      if (campos.vagas < confirmados) throw new ErroDeRegra('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados });

      await repositorio.atualizar(tx, id, campos);
      await servicoDeTarefas.salvarDoDia(tx, id, tarefas);
    }),
  );
  return diaCompleto(id);
}

/** S11: apaga a limpeza com as confirmações e tarefas. Limpezas passadas também podem ser apagadas. */
export async function apagar(id: string): Promise<void> {
  if (!(await repositorio.apagar(id))) throw new ErroDeRegra('DIA_NAO_ENCONTRADO');
}
