/** Regras de acesso do organizador (O1, O2, O6). */
import { SESSAO_HORAS, type SessaoCriada } from '@limpeza/compartilhado';
import { configuracao } from '../../configuracao.js';
import { ErroDeRegra } from '../../comum/erros.js';
import { BYTES_DO_TOKEN, conferirSenha, gerarToken, hashDeToken } from '../../comum/seguranca.js';
import * as repositorio from './repositorio.js';

/** O1, O2: senha certa cria uma sessão de 12 horas. O token puro sai daqui uma vez só. */
export async function entrar(senha: string): Promise<SessaoCriada> {
  if (!(await conferirSenha(senha, configuracao.SENHA_ORGANIZADOR_HASH))) throw new ErroDeRegra('SENHA_INCORRETA');

  await repositorio.apagarSessoesExpiradas();
  const token = gerarToken(BYTES_DO_TOKEN);
  const expiraEm = await repositorio.criarSessao(hashDeToken(token), SESSAO_HORAS);
  return { token, expiraEm: expiraEm.toISOString() };
}

/** Id da sessão do token, ou 401 SESSAO_EXPIRADA (sem token, token inválido ou vencido). */
export async function sessaoDoToken(token: string | undefined): Promise<string> {
  const sessaoId = token ? await repositorio.buscarSessaoValida(hashDeToken(token)) : undefined;
  if (!sessaoId) throw new ErroDeRegra('SESSAO_EXPIRADA');
  return sessaoId;
}

/** O6: sair apaga a sessão no servidor; o token deixa de valer na hora. */
export function sair(sessaoId: string): Promise<void> {
  return repositorio.apagarSessao(sessaoId);
}
