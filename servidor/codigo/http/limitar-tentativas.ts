/**
 * limitarTentativas({ tipo, maximo, janela, bloqueio }): a MESMA peça protege a senha de
 * organizador (O3) e o cancelamento por telefone (X3), com números diferentes.
 *
 * Regra: se as últimas `maximo` tentativas erradas do mesmo IP aconteceram dentro da `janela`,
 * o IP fica bloqueado até `bloqueio` segundos depois da última delas (429 MUITAS_TENTATIVAS).
 * As tentativas ficam na tabela tentativas_acesso, com o IP só em hash. O relógio usado é o do banco.
 *
 * Uso numa rota:
 *   const limite = limitarTentativas({ ... });
 *   router.post(caminho, limite.verificar, async (requisicao, resposta) => {
 *     await limite.contando(requisicao, ['TELEFONE_NAO_CONFERE'], () => servico.fazerAlgo());
 *   });
 */
import type { Request, RequestHandler } from 'express';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { CodigoDeErro } from '@limpeza/compartilhado';
import { bd } from '../banco/cliente.js';
import { tentativasDeAcesso, type TipoDeTentativa } from '../banco/esquema.js';
import { ErroDeRegra } from '../comum/erros.js';
import { hashDeIp } from '../comum/seguranca.js';

/** Tentativas mais velhas que isso podem ser apagadas (docs/03-banco-de-dados.md). */
const GUARDAR_POR_SEGUNDOS = 60 * 60;

interface OpcoesDoLimite {
  tipo: TipoDeTentativa;
  /** Quantas tentativas erradas bloqueiam. */
  maximo: number;
  /** Em quantos segundos essas tentativas precisam acontecer. */
  janelaSegundos: number;
  /** Quanto tempo o IP fica bloqueado depois da última tentativa errada. */
  bloqueioSegundos: number;
  /** Se um acerto zera as tentativas erradas ("5 senhas erradas seguidas", O3). */
  zerarAoAcertar?: boolean;
}

export function limitarTentativas(opcoes: OpcoesDoLimite) {
  const chaveDe = (requisicao: Pick<Request, 'ip'>) => hashDeIp(requisicao.ip ?? '');
  const doMesmoIp = (chave: string) =>
    and(eq(tentativasDeAcesso.tipo, opcoes.tipo), eq(tentativasDeAcesso.chave, chave));

  /** Segundos que ainda faltam de bloqueio; 0 se não está bloqueado. */
  async function segundosDeBloqueio(chave: string): Promise<number> {
    const ultimas = await bd
      .select({
        idadeSegundos: sql<number>`extract(epoch from now() - ${tentativasDeAcesso.criadoEm})::float8`,
      })
      .from(tentativasDeAcesso)
      .where(doMesmoIp(chave))
      .orderBy(desc(tentativasDeAcesso.criadoEm))
      .limit(opcoes.maximo);

    const maisNova = ultimas[0];
    const maisVelha = ultimas[ultimas.length - 1];
    if (!maisNova || !maisVelha || ultimas.length < opcoes.maximo) return 0;
    if (maisVelha.idadeSegundos - maisNova.idadeSegundos > opcoes.janelaSegundos) return 0;
    return Math.max(0, Math.ceil(opcoes.bloqueioSegundos - maisNova.idadeSegundos));
  }

  async function registrarErro(chave: string): Promise<void> {
    await bd.insert(tentativasDeAcesso).values({ tipo: opcoes.tipo, chave });
    await bd
      .delete(tentativasDeAcesso)
      .where(lt(tentativasDeAcesso.criadoEm, sql`now() - make_interval(secs => ${GUARDAR_POR_SEGUNDOS})`));
  }

  /** Middleware: recusa com 429 enquanto o IP estiver bloqueado. */
  const verificar: RequestHandler = async (requisicao, _resposta, proximo) => {
    const faltam = await segundosDeBloqueio(chaveDe(requisicao));
    if (faltam > 0) throw new ErroDeRegra('MUITAS_TENTATIVAS', { tentarEmSegundos: faltam });
    proximo();
  };

  /**
   * Roda a ação. Se ela falhar com um dos códigos de "tentativa errada", conta a tentativa
   * e repassa o erro. Se der certo e `zerarAoAcertar`, apaga as tentativas erradas do IP.
   */
  async function contando<T>(
    requisicao: Pick<Request, 'ip'>,
    errosQueContam: CodigoDeErro[],
    acao: () => Promise<T>,
  ): Promise<T> {
    const chave = chaveDe(requisicao);
    try {
      const resultado = await acao();
      if (opcoes.zerarAoAcertar) await bd.delete(tentativasDeAcesso).where(doMesmoIp(chave));
      return resultado;
    } catch (erro) {
      if (erro instanceof ErroDeRegra && errosQueContam.includes(erro.codigo)) await registrarErro(chave);
      throw erro;
    }
  }

  return { verificar, contando };
}
