/**
 * limitarTentativas({ tipo, maximo, janela, bloqueio }): a MESMA peça protege a senha de
 * organizador (O3) e o cancelamento por telefone (X3), com números diferentes.
 *
 * Regra: se as últimas `maximo` tentativas erradas do mesmo IP aconteceram dentro da `janela`,
 * o IP fica bloqueado até `bloqueio` segundos depois da última delas (429 MUITAS_TENTATIVAS).
 * As tentativas ficam na tabela tentativas_login, com o IP só em hash. O relógio usado é o do banco.
 *
 * Uso numa rota:
 *   const limite = limitarTentativas({ ... });
 *   router.post(caminho, limite.verificar, async (req, res) => {
 *     await limite.contando(req, ['TELEFONE_NAO_CONFERE'], () => servico.fazerAlgo());
 *   });
 */
import type { Request, RequestHandler } from 'express';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { CodigoDeErro } from '@limpeza/shared';
import { db } from '../banco/cliente.js';
import { tentativasLogin, type TipoDeTentativa } from '../banco/esquema.js';
import { ErroApp } from '../comum/erros.js';
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
  const chaveDe = (req: Pick<Request, 'ip'>) => hashDeIp(req.ip ?? '');
  const doMesmoIp = (chave: string) =>
    and(eq(tentativasLogin.tipo, opcoes.tipo), eq(tentativasLogin.chave, chave));

  /** Segundos que ainda faltam de bloqueio; 0 se não está bloqueado. */
  async function segundosDeBloqueio(chave: string): Promise<number> {
    const ultimas = await db
      .select({
        idadeSegundos: sql<number>`extract(epoch from now() - ${tentativasLogin.criadoEm})::float8`,
      })
      .from(tentativasLogin)
      .where(doMesmoIp(chave))
      .orderBy(desc(tentativasLogin.criadoEm))
      .limit(opcoes.maximo);

    const maisNova = ultimas[0];
    const maisVelha = ultimas[ultimas.length - 1];
    if (!maisNova || !maisVelha || ultimas.length < opcoes.maximo) return 0;
    if (maisVelha.idadeSegundos - maisNova.idadeSegundos > opcoes.janelaSegundos) return 0;
    return Math.max(0, Math.ceil(opcoes.bloqueioSegundos - maisNova.idadeSegundos));
  }

  async function registrarErro(chave: string): Promise<void> {
    await db.insert(tentativasLogin).values({ tipo: opcoes.tipo, chave });
    await db
      .delete(tentativasLogin)
      .where(lt(tentativasLogin.criadoEm, sql`now() - make_interval(secs => ${GUARDAR_POR_SEGUNDOS})`));
  }

  /** Middleware: recusa com 429 enquanto o IP estiver bloqueado. */
  const verificar: RequestHandler = async (req, _res, next) => {
    const faltam = await segundosDeBloqueio(chaveDe(req));
    if (faltam > 0) throw new ErroApp('MUITAS_TENTATIVAS', { tentarEmSegundos: faltam });
    next();
  };

  /**
   * Roda a ação. Se ela falhar com um dos códigos de "tentativa errada", conta a tentativa
   * e repassa o erro. Se der certo e `zerarAoAcertar`, apaga as tentativas erradas do IP.
   */
  async function contando<T>(
    req: Pick<Request, 'ip'>,
    errosQueContam: CodigoDeErro[],
    acao: () => Promise<T>,
  ): Promise<T> {
    const chave = chaveDe(req);
    try {
      const resultado = await acao();
      if (opcoes.zerarAoAcertar) await db.delete(tentativasLogin).where(doMesmoIp(chave));
      return resultado;
    } catch (erro) {
      if (erro instanceof ErroApp && errosQueContam.includes(erro.codigo)) await registrarErro(chave);
      throw erro;
    }
  }

  return { verificar, contando };
}
