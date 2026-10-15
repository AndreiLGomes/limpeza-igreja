/** Regras das sextas (S1–S13). */
import { ehPassada, ESCALA_MAX_DIAS, type DadosDia, type DiaCompleto, type DiaPublico } from '@limpeza/compartilhado';
import type { DiaComTudo } from '../../banco/esquema.js';
import { emTransacao } from '../../banco/transacao.js';
import { ErroDeRegra } from '../../comum/erros.js';
import { violouUnico } from '../../comum/erros-do-banco.js';
import { paraDiaCompleto, paraDiaPublico } from '../../comum/mapeadores.js';
import { hoje } from '../../comum/tempo.js';
import * as repositorioDeConfirmacoes from '../confirmacoes/repositorio.js';
import * as servicoDeTarefas from '../tarefas/servico.js';
import { exigirNaoPassada } from './exigir-nao-passada.js';
import * as repositorio from './repositorio.js';

/** S12, S13: as sextas de hoje em diante, em ordem de data, no máximo 8. */
function proximasSextas(): Promise<DiaComTudo[]> {
  return repositorio.listarAPartirDe(hoje(), ESCALA_MAX_DIAS);
}

async function buscarOu404(id: string): Promise<DiaComTudo> {
  const dia = await repositorio.buscarCompleto(id);
  if (!dia) throw new ErroDeRegra('DIA_NAO_ENCONTRADO');
  return dia;
}

/** S2: a data repetida é recusada pelo banco (restrição única), também em edições simultâneas. */
async function comDataUnica<T>(acao: () => Promise<T>): Promise<T> {
  try {
    return await acao();
  } catch (erro) {
    if (violouUnico(erro, 'dias_data_unica')) throw new ErroDeRegra('DATA_REPETIDA');
    throw erro;
  }
}

// ---------- Parte pública ----------

export async function escalaPublica(): Promise<DiaPublico[]> {
  return (await proximasSextas()).map(paraDiaPublico);
}

export async function diaPublico(id: string): Promise<DiaPublico> {
  return paraDiaPublico(await buscarOu404(id));
}

// ---------- Organizador ----------

export async function sextasDoOrganizador(): Promise<DiaCompleto[]> {
  return (await proximasSextas()).map(paraDiaCompleto);
}

export async function diaCompleto(id: string): Promise<DiaCompleto> {
  return paraDiaCompleto(await buscarOu404(id));
}

/** S7: nomes das tarefas da sexta mais recente (mesmo que já tenha passada); vazio se não há sextas. */
export async function sugestaoDeTarefas(): Promise<string[]> {
  const maisRecente = await repositorio.buscarMaisRecente();
  return maisRecente?.tarefas.map((tarefa) => tarefa.nome) ?? [];
}

/** S1–S5: cria a sexta com as tarefas. */
export async function criar({ tarefas, ...campos }: DadosDia): Promise<DiaCompleto> {
  if (ehPassada(campos.data, hoje())) throw new ErroDeRegra('SEXTA_PASSADA');
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
 * Edita a sexta. S10: sexta passada não pode ser editada. S1: nem ganhar uma data passada.
 * S8: vagas não podem ficar abaixo dos confirmados. S9: tarefas mantidas guardam "feita".
 * A linha fica travada durante a edição, para não correr junto com uma confirmação (C5).
 */
export async function editar(id: string, { tarefas, ...campos }: DadosDia): Promise<DiaCompleto> {
  await comDataUnica(() =>
    emTransacao(async (tx) => {
      exigirNaoPassada(await repositorio.buscarTravando(tx, id));
      if (ehPassada(campos.data, hoje())) throw new ErroDeRegra('SEXTA_PASSADA');

      const confirmados = await repositorioDeConfirmacoes.contarDoDia(tx, id);
      if (campos.vagas < confirmados) throw new ErroDeRegra('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados });

      await repositorio.atualizar(tx, id, campos);
      await servicoDeTarefas.salvarDoDia(tx, id, tarefas);
    }),
  );
  return diaCompleto(id);
}

/** S11: apaga a sexta com as confirmações e tarefas. Sextas passadas também podem ser apagadas. */
export async function apagar(id: string): Promise<void> {
  if (!(await repositorio.apagar(id))) throw new ErroDeRegra('DIA_NAO_ENCONTRADO');
}
