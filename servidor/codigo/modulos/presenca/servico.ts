/**
 * Lista de presença (L1–L14). A presença mora na própria confirmação: uma linha por pessoa por limpeza.
 * Reaproveita o repositório de confirmações, a trava da limpeza (C5) e a restrição única do telefone (C4).
 */
import {
  horaAgora, mensagemDoErro, type DadosCorrecaoPresenca, type DadosEntrada, type DadosPessoaNaPresenca, type DiaCompleto,
  type PessoaCompleta, type Presenca,
} from '@limpeza/compartilhado';
import { bd } from '../../banco/cliente.js';
import { emTransacao } from '../../banco/transacao.js';
import { ErroDeRegra } from '../../comum/erros.js';
import { comRestricaoUnica } from '../../comum/erros-do-banco.js';
import { horaOuNada as hora, paraPessoaCompleta, paraPresenca } from '../../comum/mapeadores.js';
import { BYTES_DO_CODIGO, gerarToken, hashDeToken } from '../../comum/seguranca.js';
import * as repositorio from '../confirmacoes/repositorio.js';
import * as repositorioDeDias from '../dias/repositorio.js';
import * as servicoDeDias from '../dias/servico.js';
import { exigirQueSejaHoje } from '../dias/exigir-nao-passada.js';

/** Quem entra pela lista de presença não recebe código de cancelamento: grava um aleatório, que ninguém tem. */
const codigoSemDono = () => hashDeToken(gerarToken(BYTES_DO_CODIGO));

/** L12: estado e primeiro nome de quem tem esse telefone na limpeza de hoje. Sem horários. */
export async function consultar(diaId: string, telefone: string): Promise<Presenca> {
  exigirQueSejaHoje(await repositorioDeDias.buscar(diaId));
  return paraPresenca(await repositorio.buscarPorTelefone(bd, diaId, telefone), false);
}

/**
 * "Cheguei → Confirmo" (L3–L5): grava adesão, código, EPI, a hora do servidor e a ASSINATURA (ela é feita na
 * chegada e comprova a chegada e o EPI). Já assinou ou já saiu: tocar de novo não muda nada e não devolve
 * horários (L12). Quem não confirmou antes precisa do nome.
 */
export function marcarEntrada(diaId: string, dados: DadosEntrada): Promise<Presenca> {
  const assinatura = {
    numeroAdesao: dados.numeroAdesao,
    codigoFuncao: dados.codigoFuncao,
    recebeuEpi: dados.recebeuEpi,
    assinadoEm: new Date(),
  };
  // Duas chegadas iguais ao mesmo tempo: a restrição única do telefone (C4) deixa só uma linha.
  return comRestricaoUnica('confirmacoes_telefone_unico_no_dia', 'TELEFONE_REPETIDO', () =>
    emTransacao(async (tx) => {
      exigirQueSejaHoje(await repositorioDeDias.buscarTravando(tx, diaId));
      const existente = await repositorio.buscarPorTelefone(tx, diaId, dados.telefone);
      if (existente?.assinadoEm || existente?.saida) return paraPresenca(existente, false);
      // O organizador já marcou a chegada (L8): a pessoa assina, e a entrada que ele marcou continua valendo.
      if (existente?.entrada) return paraPresenca(await repositorio.atualizar(tx, existente.id, assinatura), true);

      const entrada = horaAgora();
      if (existente) return paraPresenca(await repositorio.atualizar(tx, existente.id, { ...assinatura, entrada }), true);

      if (!dados.nome) {
        // A mesma frase vai no aviso e embaixo do campo Nome, que a tela passa a mostrar.
        throw new ErroDeRegra('NOME_OBRIGATORIO', { campos: { nome: mensagemDoErro('NOME_OBRIGATORIO') } });
      }
      // L3: entra na lista na hora, mesmo com as vagas cheias. Essa pessoa cancela pelo telefone (X2) ou
      // pelo organizador, porque o código de cancelamento é aleatório e ninguém o recebe.
      const criada = await repositorio.inserir(tx, {
        diaId,
        nome: dados.nome,
        telefone: dados.telefone,
        tempo: 'todo',
        codigoCancelamentoHash: codigoSemDono(),
        ...assinatura,
        entrada,
      });
      return paraPresenca(criada, true);
    }),
  );
}

/**
 * "Saí" (L6, L7): grava só a hora de saída; a assinatura já foi feita na chegada. Já saiu (pelo app ou pelo
 * "Encerrar limpeza", L13): JA_SAIU, e a saída gravada fica.
 */
export async function marcarSaida(diaId: string, telefone: string): Promise<Presenca> {
  exigirQueSejaHoje(await repositorioDeDias.buscar(diaId));
  const pessoa = await repositorio.buscarPorTelefone(bd, diaId, telefone);
  if (!pessoa) throw new ErroDeRegra('TELEFONE_NAO_CONFERE');
  if (!pessoa.entrada) throw new ErroDeRegra('SEM_ENTRADA');
  if (pessoa.saida) throw new ErroDeRegra('JA_SAIU');
  const agora = horaAgora();
  const entrada = hora(pessoa.entrada)!;
  // A saída nunca fica antes da entrada (o organizador pode ter corrigido a entrada para mais tarde).
  const saida = agora < entrada ? entrada : agora;
  return paraPresenca(await repositorio.atualizar(bd, pessoa.id, { saida }), true);
}

/**
 * L8: o organizador corrige adesão, código, EPI, entrada e saída, em qualquer limpeza. Ele pode desfazer
 * uma assinatura, mas nunca cria uma. A assinatura é da chegada: mudar a entrada ou o EPI de quem assinou
 * desfaz a assinatura; mudar só a saída, a adesão ou o código, não.
 */
export async function corrigir(diaId: string, pessoaId: string, dados: DadosCorrecaoPresenca): Promise<PessoaCompleta> {
  const pessoa = await repositorio.buscarDoDia(bd, diaId, pessoaId);
  if (!pessoa) throw new ErroDeRegra('PESSOA_NAO_ENCONTRADA');
  const mudouOQueFoiAssinado = hora(pessoa.entrada) !== dados.entrada || pessoa.recebeuEpi !== dados.recebeuEpi;
  const { desfazerAssinatura, ...campos } = dados;
  const atualizada = await repositorio.atualizar(bd, pessoa.id, {
    ...campos,
    assinadoEm: desfazerAssinatura || mudouOQueFoiAssinado ? null : pessoa.assinadoEm,
  });
  return paraPessoaCompleta(atualizada);
}

/**
 * L13: grava a mesma saída em quem marcou entrada e não saiu, sem assinar por ninguém (assinam no papel).
 * Hora antes da entrada de alguém: recusa tudo e diz quem chegou depois.
 */
export async function encerrar(diaId: string, saida: string = horaAgora()): Promise<DiaCompleto> {
  await emTransacao(async (tx) => {
    if (!(await repositorioDeDias.buscarTravando(tx, diaId))) throw new ErroDeRegra('DIA_NAO_ENCONTRADO');
    const pessoas = await repositorio.semSaida(tx, diaId);
    const depois = pessoas.filter((pessoa) => hora(pessoa.entrada)! > saida);
    if (depois.length > 0) {
      throw new ErroDeRegra('HORARIO_INVALIDO', {
        pessoas: depois.map((pessoa) => ({ nome: pessoa.nome, entrada: hora(pessoa.entrada) })),
      });
    }
    for (const pessoa of pessoas) await repositorio.atualizar(tx, pessoa.id, { saida });
  });
  return servicoDeDias.diaCompleto(diaId);
}

/**
 * L14: o organizador cadastra quem chegou sem confirmar e sem celular, já com a entrada. Não esbarra nas
 * vagas (a pessoa já está lá). Telefone repetido na mesma limpeza: TELEFONE_REPETIDO (C4).
 */
export function adicionar(diaId: string, dados: DadosPessoaNaPresenca): Promise<PessoaCompleta> {
  return comRestricaoUnica('confirmacoes_telefone_unico_no_dia', 'TELEFONE_REPETIDO', async () => {
    if (!(await repositorioDeDias.buscar(diaId))) throw new ErroDeRegra('DIA_NAO_ENCONTRADO');
    const criada = await repositorio.inserir(bd, { diaId, ...dados, tempo: 'todo', codigoCancelamentoHash: codigoSemDono() });
    return paraPessoaCompleta(criada);
  });
}
