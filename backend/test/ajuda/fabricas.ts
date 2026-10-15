/**
 * Fábricas de dados para os testes: criam linhas no banco com valores padrão válidos.
 * Passe só o que importa para o teste, ex.: criarDia({ vagas: 1 }).
 * Nenhum teste monta dados "na mão" quando existe uma fábrica para isso.
 */
import { FIM_PADRAO, INICIO_PADRAO, somarDias, VAGAS_PADRAO } from '@limpeza/shared';
import { db } from '../../src/banco/cliente.js';
import { confirmacoes, dias, tarefas } from '../../src/banco/esquema.js';
import { BYTES_DO_CODIGO, gerarToken, hashDeToken } from '../../src/comum/seguranca.js';
import { hoje } from '../../src/comum/tempo.js';

export type Dia = typeof dias.$inferSelect;
export type Confirmacao = typeof confirmacoes.$inferSelect;
export type TarefaDoBanco = typeof tarefas.$inferSelect;

/** Contador para gerar datas, nomes e telefones diferentes a cada chamada. */
let sequencia = 0;
const proximo = () => ++sequencia;

/** Uma sexta no futuro (a partir de daqui a uma semana), 19:00–21:00, 5 vagas. */
export async function criarDia(dados: Partial<typeof dias.$inferInsert> = {}): Promise<Dia> {
  const [dia] = await db
    .insert(dias)
    .values({
      data: somarDias(hoje(), 7 + proximo()),
      inicio: INICIO_PADRAO,
      fim: FIM_PADRAO,
      vagas: VAGAS_PADRAO,
      ...dados,
    })
    .returning();
  return dia!;
}

/** Sexta que já passou (ontem). */
export function criarDiaPassado(dados: Partial<typeof dias.$inferInsert> = {}): Promise<Dia> {
  return criarDia({ data: somarDias(hoje(), -1), ...dados });
}

export async function criarTarefa(
  dia: Pick<Dia, 'id'>,
  dados: Partial<typeof tarefas.$inferInsert> = {},
): Promise<TarefaDoBanco> {
  const n = proximo();
  const [tarefa] = await db
    .insert(tarefas)
    .values({ diaId: dia.id, nome: `Tarefa ${n}`, ordem: n, ...dados })
    .returning();
  return tarefa!;
}

/**
 * Uma confirmação de presença. Devolve também o `codigo` puro (o banco só guarda o hash),
 * para os testes de cancelamento pelo celular.
 */
export async function criarConfirmacao(
  dia: Pick<Dia, 'id'>,
  dados: Partial<typeof confirmacoes.$inferInsert> = {},
): Promise<Confirmacao & { codigo: string }> {
  const n = proximo();
  const codigo = gerarToken(BYTES_DO_CODIGO);
  const [confirmacao] = await db
    .insert(confirmacoes)
    .values({
      diaId: dia.id,
      nome: `Pessoa de Teste ${n}`,
      telefone: `479${String(n).padStart(8, '0')}`,
      tempo: 'todo',
      codigoCancelamentoHash: hashDeToken(codigo),
      ...dados,
    })
    .returning();
  return { ...confirmacao!, codigo };
}
