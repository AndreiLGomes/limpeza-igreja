/**
 * O ÚNICO lugar que monta o que sai pela API (docs/04-api.md).
 * paraPessoaPublica() simplesmente NÃO TEM telefone nem observação: a LGPD (P1, P2) é garantida
 * pelo formato, e não por cuidado em cada rota.
 */
import {
  formatarTelefone, type Cabecalho, type DiaCompleto, type DiaPublico, type PessoaCompleta, type PessoaPublica, type Presenca,
  type Tarefa, type Tempo, type TipoDeServico,
} from '@limpeza/compartilhado';
import type { Confirmacao, DiaComTudo, TarefaDoBanco } from '../banco/esquema.js';

/** O banco devolve "19:00:00"; a API usa "19:00" (D3). */
const horaCurta = (hora: string) => hora.slice(0, 5);
/** "19:30:00" → "19:30"; vazio continua vazio. Usada também pela presença para comparar horários. */
export const horaOuNada = (hora: string | null) => (hora === null ? null : horaCurta(hora));

export function paraTarefa(tarefa: TarefaDoBanco): Tarefa {
  return { id: tarefa.id, nome: tarefa.nome, feita: tarefa.feita };
}

export function paraPessoaPublica(pessoa: Confirmacao): PessoaPublica {
  return { id: pessoa.id, nome: pessoa.nome, tempo: pessoa.tempo as Tempo };
}

export function paraPessoaCompleta(pessoa: Confirmacao): PessoaCompleta {
  return {
    ...paraPessoaPublica(pessoa),
    telefone: pessoa.telefone === null ? null : formatarTelefone(pessoa.telefone),
    observacao: pessoa.observacao,
    criadoEm: pessoa.criadoEm.toISOString(),
    numeroAdesao: pessoa.numeroAdesao,
    codigoFuncao: pessoa.codigoFuncao,
    recebeuEpi: pessoa.recebeuEpi,
    entrada: horaOuNada(pessoa.entrada),
    saida: horaOuNada(pessoa.saida),
    assinadoEm: pessoa.assinadoEm?.toISOString() ?? null,
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

/** L10: o cabeçalho, de uma limpeza ou do padrão (as colunas são as mesmas). */
export function paraCabecalho(linha: Record<keyof Cabecalho, string | null>): Cabecalho {
  return {
    casaDeOracao: linha.casaDeOracao,
    local: linha.local,
    setor: linha.setor,
    atividades: linha.atividades,
    tipoDeServico: linha.tipoDeServico as TipoDeServico | null,
  };
}

export function paraDiaCompleto(dia: DiaComTudo): DiaCompleto {
  return { ...camposDoDia(dia), pessoas: dia.pessoas.map(paraPessoaCompleta), cabecalho: paraCabecalho(dia) };
}

/**
 * L12: o que a parte pública vê da presença. Sem horários (só com `comHorarios`, para quem acabou de agir),
 * sem adesão, código, EPI, telefone ou nome completo.
 */
export function paraPresenca(pessoa: Confirmacao | undefined, comHorarios: boolean): Presenca {
  const estado = pessoa?.saida ? 'saiu' : pessoa?.entrada ? 'chegou' : 'fora';
  const primeiroNome = pessoa ? (pessoa.nome.split(' ')[0] ?? pessoa.nome) : null;
  if (!pessoa || !comHorarios) return { estado, primeiroNome, entrada: null, saida: null, assinadoEm: null };
  return {
    estado,
    primeiroNome,
    entrada: horaOuNada(pessoa.entrada),
    saida: horaOuNada(pessoa.saida),
    assinadoEm: pessoa.assinadoEm?.toISOString() ?? null,
  };
}
