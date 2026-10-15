/**
 * O ÚNICO lugar que monta o que sai pela API (docs/04-api.md).
 * paraPessoaPublica() simplesmente NÃO TEM telefone nem observação: a LGPD (P1, P2) é garantida
 * pelo formato, e não por cuidado em cada rota.
 */
import {
  formatarTelefone, type DiaCompleto, type DiaPublico, type PessoaCompleta, type PessoaPublica, type Tarefa,
  type Tempo,
} from '@limpeza/compartilhado';
import type { Confirmacao, DiaComTudo, TarefaDoBanco } from '../banco/esquema.js';

/** O banco devolve "19:00:00"; a API usa "19:00" (D3). */
const horaCurta = (hora: string) => hora.slice(0, 5);

export function paraTarefa(tarefa: TarefaDoBanco): Tarefa {
  return { id: tarefa.id, nome: tarefa.nome, feita: tarefa.feita };
}

export function paraPessoaPublica(pessoa: Confirmacao): PessoaPublica {
  return { id: pessoa.id, nome: pessoa.nome, tempo: pessoa.tempo as Tempo };
}

export function paraPessoaCompleta(pessoa: Confirmacao): PessoaCompleta {
  return {
    ...paraPessoaPublica(pessoa),
    telefone: formatarTelefone(pessoa.telefone),
    observacao: pessoa.observacao,
    criadoEm: pessoa.criadoEm.toISOString(),
  };
}

/** O que é igual na visão pública e na do organizador. */
function camposDoDia(dia: DiaComTudo) {
  return {
    id: dia.id,
    data: dia.data,
    inicio: horaCurta(dia.inicio),
    fim: horaCurta(dia.fim),
    vagas: dia.vagas,
    tarefas: dia.tarefas.map(paraTarefa),
  };
}

export function paraDiaPublico(dia: DiaComTudo): DiaPublico {
  return { ...camposDoDia(dia), pessoas: dia.pessoas.map(paraPessoaPublica) };
}

export function paraDiaCompleto(dia: DiaComTudo): DiaCompleto {
  return { ...camposDoDia(dia), pessoas: dia.pessoas.map(paraPessoaCompleta) };
}
