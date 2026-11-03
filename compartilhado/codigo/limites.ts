/**
 * Números das regras de negócio (docs/02-regras-de-negocio.md e docs/05-seguranca.md).
 * Nenhum outro arquivo escreve estes números à mão.
 */

/** C1: nome de quem confirma, depois de tirar os espaços das pontas. */
export const NOME_MIN = 3;
export const NOME_MAX = 80;

/** C2: telefone do Brasil com DDD, só os números. */
export const TELEFONE_MIN_DIGITOS = 10;
export const TELEFONE_MAX_DIGITOS = 11;

/** Observação opcional da confirmação. */
export const OBSERVACAO_MAX = 200;

/** S4: vagas de uma limpeza. */
export const VAGAS_MIN = 1;
export const VAGAS_MAX = 30;
export const VAGAS_PADRAO = 5;

/** S3: horários padrão ao criar uma limpeza. */
export const INICIO_PADRAO = '19:00';
export const FIM_PADRAO = '21:00';

/** S5: tarefas de uma limpeza. */
export const TAREFAS_MAX = 30;
export const TAREFA_NOME_MIN = 1;
export const TAREFA_NOME_MAX = 80;

/** S12: quantas limpezas a escala pública mostra. */
export const ESCALA_MAX_DIAS = 8;

/** O2: validade da sessão do organizador. */
export const SESSAO_HORAS = 12;

/** O3: senhas erradas seguidas por IP e tempo de bloqueio. */
export const SENHA_TENTATIVAS_MAX = 5;
export const SENHA_BLOQUEIO_SEGUNDOS = 60;

/** X3: cancelamentos por telefone errados por IP, janela e bloqueio. */
export const CANCELAMENTO_TENTATIVAS_MAX = 5;
export const CANCELAMENTO_JANELA_SEGUNDOS = 10 * 60;
export const CANCELAMENTO_BLOQUEIO_SEGUNDOS = 10 * 60;

/** Limite geral de escritas (POST, PUT, PATCH, DELETE) por IP (docs/04-api.md). */
export const ESCRITAS_POR_MINUTO = 60;
