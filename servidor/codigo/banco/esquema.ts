/**
 * Tabelas do banco (Drizzle), espelhando docs/03-banco-de-dados.md.
 * As restrições ficam NO BANCO (CHECK, UNIQUE, CASCADE): mesmo um erro no código não grava dado inválido.
 * Os números vêm do compartilhado/limites.ts, para a regra ser escrita uma vez só.
 */
import { sql } from 'drizzle-orm';
import {
  boolean, check, date, index, pgTable, smallint, time, timestamp, unique, uuid, varchar,
} from 'drizzle-orm/pg-core';
import {
  NOME_MAX, NOME_MIN, OBSERVACAO_MAX, TAREFA_NOME_MAX, TAREFA_NOME_MIN, TELEFONE_MAX_DIGITOS,
  TELEFONE_MIN_DIGITOS, TEMPOS, VAGAS_MAX, VAGAS_MIN,
} from '@limpeza/compartilhado';

/** Escreve um número ou texto fixo dentro do SQL das restrições. */
const literal = (valor: number | string) =>
  sql.raw(typeof valor === 'number' ? String(valor) : `'${valor.replaceAll("'", "''")}'`);

/** Lista para "IN (...)" dentro do SQL das restrições. */
const listaLiteral = (valores: readonly string[]) => sql.raw(valores.map((v) => `'${v}'`).join(', '));

const TIPOS_DE_TENTATIVA = ['senha', 'cancelamento'] as const;
export type TipoDeTentativa = (typeof TIPOS_DE_TENTATIVA)[number];

/** Toda tabela tem id uuid gerado pelo banco e criado_em / atualizado_em. */
const colunasPadrao = {
  id: uuid('id').primaryKey().defaultRandom(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Cada dia de limpeza. */
export const dias = pgTable(
  'dias',
  {
    ...colunasPadrao,
    data: date('data', { mode: 'string' }).notNull(),
    inicio: time('inicio').notNull(),
    fim: time('fim').notNull(),
    vagas: smallint('vagas').notNull(),
  },
  (t) => [
    unique('dias_data_unica').on(t.data), // S2
    check('dias_fim_depois_do_inicio', sql`${t.fim} > ${t.inicio}`), // S3
    check('dias_vagas_validas', sql`${t.vagas} BETWEEN ${literal(VAGAS_MIN)} AND ${literal(VAGAS_MAX)}`), // S4
  ],
);

/** Quem vem em cada limpeza. */
export const confirmacoes = pgTable(
  'confirmacoes',
  {
    ...colunasPadrao,
    diaId: uuid('dia_id')
      .notNull()
      .references(() => dias.id, { onDelete: 'cascade' }), // S11
    nome: varchar('nome', { length: NOME_MAX }).notNull(),
    telefone: varchar('telefone', { length: TELEFONE_MAX_DIGITOS }).notNull(),
    tempo: varchar('tempo', { length: 20 }).notNull(),
    observacao: varchar('observacao', { length: OBSERVACAO_MAX }),
    /** Hash do código devolvido ao celular (C7, X1). Nunca o código puro. */
    codigoCancelamentoHash: varchar('codigo_cancelamento_hash').notNull(),
  },
  (t) => [
    unique('confirmacoes_telefone_unico_no_dia').on(t.diaId, t.telefone), // C4
    unique('confirmacoes_codigo_unico').on(t.codigoCancelamentoHash),
    index('confirmacoes_dia_id_idx').on(t.diaId),
    check(
      'confirmacoes_nome_tamanho',
      sql`char_length(${t.nome}) BETWEEN ${literal(NOME_MIN)} AND ${literal(NOME_MAX)}`,
    ), // C1
    check(
      'confirmacoes_telefone_so_digitos',
      sql`${t.telefone} ~ ${literal(`^[0-9]{${TELEFONE_MIN_DIGITOS},${TELEFONE_MAX_DIGITOS}}$`)}`,
    ), // C2
    check('confirmacoes_tempo_valido', sql`${t.tempo} IN (${listaLiteral(TEMPOS)})`),
  ],
);

/** O que limpar em cada limpeza. */
export const tarefas = pgTable(
  'tarefas',
  {
    ...colunasPadrao,
    diaId: uuid('dia_id')
      .notNull()
      .references(() => dias.id, { onDelete: 'cascade' }), // S11
    nome: varchar('nome', { length: TAREFA_NOME_MAX }).notNull(),
    ordem: smallint('ordem').notNull(),
    feita: boolean('feita').notNull().default(false),
    feitaEm: timestamp('feita_em', { withTimezone: true }),
  },
  (t) => [
    unique('tarefas_nome_unico_no_dia').on(t.diaId, t.nome), // S5
    index('tarefas_dia_id_idx').on(t.diaId),
    check(
      'tarefas_nome_tamanho',
      sql`char_length(${t.nome}) BETWEEN ${literal(TAREFA_NOME_MIN)} AND ${literal(TAREFA_NOME_MAX)}`,
    ),
  ],
);

/** Linhas como vêm do banco. */
export type Dia = typeof dias.$inferSelect;
export type Confirmacao = typeof confirmacoes.$inferSelect;
export type TarefaDoBanco = typeof tarefas.$inferSelect;

/** Uma limpeza com as pessoas (em ordem de confirmação) e as tarefas (em ordem). */
export type DiaComTudo = Dia & { pessoas: Confirmacao[]; tarefas: TarefaDoBanco[] };

/** Quem entrou com a senha de organizador (O2). */
export const sessoesOrganizador = pgTable(
  'sessoes_organizador',
  {
    ...colunasPadrao,
    /** Hash do token entregue ao navegador. Nunca o token puro. */
    tokenHash: varchar('token_hash').notNull(),
    expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
  },
  (t) => [unique('sessoes_token_unico').on(t.tokenHash)],
);

/** Tentativas erradas de senha (O3) e de cancelamento por telefone (X3). */
export const tentativasDeAcesso = pgTable(
  'tentativas_acesso',
  {
    ...colunasPadrao,
    tipo: varchar('tipo', { length: 20 }).notNull(),
    /** Hash do IP. Nunca o IP puro. */
    chave: varchar('chave').notNull(),
  },
  (t) => [
    index('tentativas_busca_idx').on(t.tipo, t.chave, t.criadoEm),
    check('tentativas_tipo_valido', sql`${t.tipo} IN (${listaLiteral(TIPOS_DE_TENTATIVA)})`),
  ],
);
