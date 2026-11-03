/**
 * Validação de cada entrada da API (Zod), com as mensagens em português.
 * O servidor usa no intermediário validar(); o site usa nos formulários, pelo validadorZod().
 * Campos a mais são ignorados (o z.object do Zod já descarta chaves desconhecidas).
 */
import { z } from 'zod';
import { ehDataValida, FORMATO_HORA } from './datas.js';
import {
  ADESAO_MAX_DIGITOS, CODIGO_FUNCAO_MAX_DIGITOS, NOME_MAX, NOME_MIN, OBSERVACAO_MAX, TAREFA_NOME_MAX, TAREFAS_MAX,
  VAGAS_MAX, VAGAS_MIN,
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
  adesaoObrigatoria: 'Digite seu nº de adesão.',
  adesaoInvalida: `O nº de adesão tem só números, até ${ADESAO_MAX_DIGITOS}.`,
  codigoFuncaoObrigatorio: 'Digite o código da função.',
  codigoFuncaoInvalido: `O código da função tem só números, até ${CODIGO_FUNCAO_MAX_DIGITOS}.`,
  epiObrigatorio: 'Responda se recebeu EPI.',
  saidaSemEntrada: 'Preencha a entrada antes da saída.',
  saidaAntesDaEntrada: 'A saída não pode ser antes da entrada.',
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

/** L4: só números, guardado como texto para manter o zero da frente ("08"). */
const soNumeros = (maximo: number, obrigatorio: string, invalido: string) =>
  z
    .string({ error: obrigatorio })
    .trim()
    .min(1, { error: obrigatorio, abort: true })
    .regex(new RegExp(`^[0-9]{1,${maximo}}$`), { error: invalido });

const numeroAdesao = soNumeros(ADESAO_MAX_DIGITOS, MENSAGENS.adesaoObrigatoria, MENSAGENS.adesaoInvalida);
const codigoFuncao = soNumeros(
  CODIGO_FUNCAO_MAX_DIGITOS, MENSAGENS.codigoFuncaoObrigatorio, MENSAGENS.codigoFuncaoInvalido,
);
const recebeuEpi = z.boolean({ error: MENSAGENS.epiObrigatorio });

/** Campo que pode ficar em branco: texto vazio (ou ausente) vira null. */
const vazioViraNulo = <T extends z.ZodType>(esquema: T) =>
  z.preprocess((valor) => (valor === '' ? null : valor), esquema.nullish()).transform((valor) => valor ?? null);

const horaOpcional = vazioViraNulo(horaDoDia);
/** L14: só quem o organizador cadastra pode ficar sem telefone. */
const telefoneOpcional = vazioViraNulo(telefone);

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

/**
 * Só o telefone: cancelar pelo telefone (X2), consultar a presença (L12) e marcar a saída (L6).
 * O telefone vai no corpo, nunca no endereço.
 */
export const esquemaTelefone = z.object({ telefone });

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

/** POST /dias/:id/presenca/entrada (L3, L4). O nome só é pedido de quem não confirmou antes. */
export const esquemaEntrada = z.object({ telefone, nome: nome.optional(), numeroAdesao, codigoFuncao, recebeuEpi });

/** L8, L14: "a saída não pode ser antes da entrada", e não existe saída sem entrada. */
function regraDosHorarios(presenca: { entrada: string | null; saida: string | null }, contexto: z.RefinementCtx) {
  if (presenca.saida && !presenca.entrada) {
    contexto.addIssue({ code: 'custom', path: ['saida'], message: MENSAGENS.saidaSemEntrada });
  } else if (presenca.saida && presenca.entrada && presenca.saida < presenca.entrada) {
    contexto.addIssue({ code: 'custom', path: ['saida'], message: MENSAGENS.saidaAntesDaEntrada });
  }
}

/** PUT /organizador/dias/:id/pessoas/:pessoaId/presenca (L8). Não existe campo para CRIAR assinatura. */
export const esquemaCorrecaoPresenca = z
  .object({
    numeroAdesao: vazioViraNulo(numeroAdesao),
    codigoFuncao: vazioViraNulo(codigoFuncao),
    recebeuEpi: recebeuEpi.nullable(),
    entrada: horaOpcional,
    saida: horaOpcional,
    desfazerAssinatura: z.boolean().default(false),
  })
  .superRefine(regraDosHorarios);

/**
 * POST /organizador/dias/:id/presenca (L14): o organizador cadastra quem chegou sem confirmar e sem celular.
 * O telefone é opcional só aqui (a C2 continua valendo para quem confirma pelo app). A entrada é obrigatória.
 */
export const esquemaPessoaNaPresenca = z
  .object({
    nome, telefone: telefoneOpcional, numeroAdesao, codigoFuncao, recebeuEpi, entrada: horaDoDia, saida: horaOpcional,
  })
  .superRefine(regraDosHorarios);

/** POST /organizador/dias/:id/encerrar (L13). Sem hora, vale a hora de agora. */
export const esquemaEncerrar = z.object({ saida: horaDoDia.optional() });

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
export type EntradaPresenca = z.input<typeof esquemaEntrada>;
export type DadosEntrada = z.output<typeof esquemaEntrada>;
export type EntradaCorrecaoPresenca = z.input<typeof esquemaCorrecaoPresenca>;
export type DadosCorrecaoPresenca = z.output<typeof esquemaCorrecaoPresenca>;
export type EntradaPessoaNaPresenca = z.input<typeof esquemaPessoaNaPresenca>;
export type DadosPessoaNaPresenca = z.output<typeof esquemaPessoaNaPresenca>;

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
