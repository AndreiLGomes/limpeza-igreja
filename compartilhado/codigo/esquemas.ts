/**
 * Validação de cada entrada da API (Zod), com as mensagens em português.
 * O servidor usa no intermediário validar(); o site usa nos formulários, pelo validadorZod().
 * Campos a mais são ignorados (o z.object do Zod já descarta chaves desconhecidas).
 */
import { z } from 'zod';
import { ehDataValida, FORMATO_HORA } from './datas.js';
import {
  NOME_MAX, NOME_MIN, OBSERVACAO_MAX, TAREFA_NOME_MAX, TAREFAS_MAX, VAGAS_MAX, VAGAS_MIN,
} from './limites.js';
import { ehTelefoneValido, soDigitos } from './telefone.js';
import { TEMPOS } from './tipos.js';

/** Mensagens de campo. Também aparecem no site, embaixo de cada campo. */
export const MENSAGENS = {
  nomeObrigatorio: 'Digite seu nome.',
  nomeCurto: `Digite seu nome com pelo menos ${NOME_MIN} letras.`,
  nomeLongo: `O nome pode ter no máximo ${NOME_MAX} letras.`,
  telefoneObrigatorio: 'Digite seu telefone com DDD.',
  telefoneInvalido: 'Digite o número com DDD, ex.: 47 99999-9999.',
  tempoInvalido: 'Escolha quanto tempo você pode ficar.',
  observacaoLonga: `A observação pode ter no máximo ${OBSERVACAO_MAX} letras.`,
  codigoObrigatorio: 'Código de cancelamento não informado.',
  feitaInvalida: 'Informe se a tarefa foi feita ou não.',
  senhaObrigatoria: 'Digite a senha de organizador.',
  dataObrigatoria: 'Escolha a data.',
  dataInvalida: 'Escolha uma data válida.',
  horaObrigatoria: 'Escolha o horário.',
  horaInvalida: 'Escolha um horário válido.',
  fimAntesDoInicio: 'O horário de fim tem que ser depois do início.',
  vagasInvalidas: `As vagas vão de ${VAGAS_MIN} a ${VAGAS_MAX}.`,
  tarefaLonga: `Cada tarefa pode ter no máximo ${TAREFA_NOME_MAX} letras.`,
  tarefasDemais: `Uma limpeza pode ter no máximo ${TAREFAS_MAX} tarefas.`,
  tarefaRepetida: (nome: string) => `A tarefa "${nome}" aparece mais de uma vez.`,
  idInvalido: 'Endereço inválido.',
} as const;

// ---------- Campos (reaproveitados pelos esquemas e pelos formulários do site) ----------

const id = z.uuid({ error: MENSAGENS.idInvalido });

const nome = z
  .string({ error: MENSAGENS.nomeObrigatorio })
  .trim()
  .min(1, { error: MENSAGENS.nomeObrigatorio, abort: true })
  .min(NOME_MIN, { error: MENSAGENS.nomeCurto })
  .max(NOME_MAX, { error: MENSAGENS.nomeLongo });

/** C2: aceita com máscara; a saída é só com os números. */
const telefone = z
  .string({ error: MENSAGENS.telefoneObrigatorio })
  .trim()
  .min(1, { error: MENSAGENS.telefoneObrigatorio, abort: true })
  .refine(ehTelefoneValido, { error: MENSAGENS.telefoneInvalido })
  .transform(soDigitos);

const tempo = z.enum(TEMPOS, { error: MENSAGENS.tempoInvalido }).default('todo');

/** Opcional: texto vazio vira null. */
const observacao = z
  .string({ error: MENSAGENS.observacaoLonga })
  .trim()
  .max(OBSERVACAO_MAX, { error: MENSAGENS.observacaoLonga })
  .nullish()
  .transform((valor) => valor || null);

const data = z
  .string({ error: MENSAGENS.dataObrigatoria })
  .min(1, { error: MENSAGENS.dataObrigatoria, abort: true })
  .refine(ehDataValida, { error: MENSAGENS.dataInvalida });

const horaDoDia = z
  .string({ error: MENSAGENS.horaObrigatoria })
  .min(1, { error: MENSAGENS.horaObrigatoria, abort: true })
  .regex(FORMATO_HORA, { error: MENSAGENS.horaInvalida });

const vagas = z
  .number({ error: MENSAGENS.vagasInvalidas })
  .int({ error: MENSAGENS.vagasInvalidas })
  .min(VAGAS_MIN, { error: MENSAGENS.vagasInvalidas })
  .max(VAGAS_MAX, { error: MENSAGENS.vagasInvalidas });

/** Tarefa vinda do formulário: com `id` se já existia (S9), sem `id` se é nova. */
const tarefaEditada = z.object({
  id: id.optional(),
  nome: z.string().trim().max(TAREFA_NOME_MAX, { error: MENSAGENS.tarefaLonga }),
});

/** S5: linhas vazias são ignoradas; no máximo 30; nomes repetidos não. */
const tarefas = z
  .array(tarefaEditada)
  .default([])
  .transform((lista) => lista.filter((tarefa) => tarefa.nome !== ''))
  .refine((lista) => lista.length <= TAREFAS_MAX, { error: MENSAGENS.tarefasDemais })
  .superRefine((lista, contexto) => {
    const vistos = new Set<string>();
    for (const tarefa of lista) {
      if (vistos.has(tarefa.nome)) {
        contexto.addIssue({ code: 'custom', message: MENSAGENS.tarefaRepetida(tarefa.nome) });
        return;
      }
      vistos.add(tarefa.nome);
    }
  });

// ---------- Entradas da API ----------

/** POST /dias/:id/confirmacoes (C1, C2) e desfazer remoção (O5). */
export const esquemaConfirmacao = z.object({ nome, telefone, tempo, observacao });

/** POST /confirmacoes/cancelar (X1). */
export const esquemaCancelarPorCodigo = z.object({
  codigoCancelamento: z
    .string({ error: MENSAGENS.codigoObrigatorio })
    .trim()
    .min(1, { error: MENSAGENS.codigoObrigatorio }),
});

/** POST /dias/:id/confirmacoes/cancelar-por-telefone (X2). */
export const esquemaCancelarPorTelefone = z.object({ telefone });

/** PATCH /dias/:id/tarefas/:tarefaId (T1). */
export const esquemaMarcarTarefa = z.object({
  feita: z.boolean({ error: MENSAGENS.feitaInvalida }),
});

/** POST /organizador/entrar (O1). A senha não é aparada: espaços fazem parte dela. */
export const esquemaEntrar = z.object({
  senha: z.string({ error: MENSAGENS.senhaObrigatoria }).min(1, { error: MENSAGENS.senhaObrigatoria }),
});

/** POST e PUT /organizador/dias (S3, S4, S5). */
export const esquemaDia = z
  .object({ data, inicio: horaDoDia, fim: horaDoDia, vagas, tarefas })
  .refine(
    (dia) => !FORMATO_HORA.test(dia.inicio) || !FORMATO_HORA.test(dia.fim) || dia.fim > dia.inicio,
    { error: MENSAGENS.fimAntesDoInicio, path: ['fim'] },
  );

// ---------- Parâmetros de endereço ----------

export const esquemaParametrosDia = z.object({ id });
export const esquemaParametrosTarefa = z.object({ id, tarefaId: id });
export const esquemaParametrosPessoa = z.object({ id, pessoaId: id });

// ---------- Tipos das entradas ----------

/** Como o site envia (antes da validação). */
export type EntradaConfirmacao = z.input<typeof esquemaConfirmacao>;
export type EntradaDia = z.input<typeof esquemaDia>;
/** Como o servidor recebe (depois da validação). */
export type DadosConfirmacao = z.output<typeof esquemaConfirmacao>;
export type DadosDia = z.output<typeof esquemaDia>;
export type TarefaEditada = z.output<typeof tarefaEditada>;

/**
 * Transforma um erro do Zod em `campos` (docs/04-api.md): nome do campo → primeira mensagem.
 * Campos aninhados usam ponto, ex.: "tarefas.2.nome".
 */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const problema of erro.issues) {
    const chave = problema.path.map(String).join('.') || '_';
    campos[chave] ??= problema.message;
  }
  return campos;
}
