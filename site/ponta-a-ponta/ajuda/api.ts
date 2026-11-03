/**
 * Chamadas diretas à API nos testes de ponta a ponta, para montar a situação de um teste (ex.: uma limpeza
 * HOJE, que os dados de exemplo não têm). Usa a senha só dos testes.
 */
import { hoje, ROTAS } from '@limpeza/compartilhado';
import { ENDERECO_DA_API, SENHA_DOS_TESTES } from './ambiente';

async function chamar<T>(caminho: string, corpo: object, token?: string): Promise<T> {
  const resposta = await fetch(`${ENDERECO_DA_API}${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) throw new Error(`${caminho} respondeu ${resposta.status}: ${await resposta.text()}`);
  return (await resposta.json()) as T;
}

/** Cria a limpeza de hoje (00:00 às 23:59), com o cabeçalho da folha se vier, e confirma as pessoas. Devolve o id. */
export async function criarLimpezaDeHoje(
  pessoas: { nome: string; telefone: string }[] = [],
  cabecalho?: object,
): Promise<string> {
  const { token } = await chamar<{ token: string }>(ROTAS.organizador.entrar, { senha: SENHA_DOS_TESTES });
  const { id } = await chamar<{ id: string }>(
    ROTAS.organizador.dias,
    { data: hoje(), inicio: '00:00', fim: '23:59', vagas: 5, tarefas: [], cabecalho },
    token,
  );
  for (const pessoa of pessoas) await chamar(ROTAS.confirmar(id), { ...pessoa, tempo: 'todo' });
  return id;
}

/** Marca a chegada de alguém pela API (para os testes do organizador). */
export function marcarChegada(diaId: string, telefone: string): Promise<unknown> {
  return chamar(ROTAS.presenca.entrada(diaId), { telefone, numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true });
}
