/**
 * Mensagens de campo. As regras (nome, telefone, vagas…) vêm dos esquemas do compartilhado, pelo
 * validadorZod. Aqui fica só o que NÃO vem do esquema (docs/06, regra 4).
 */
import type { ValidationErrors } from '@angular/forms';

/** Para um campo com erro que não tem mensagem própria (não deveria acontecer). */
const MENSAGEM_PADRAO = 'Confira este campo.';

/**
 * A mensagem a mostrar embaixo do campo, ou null se não há erro.
 * - `servidor`: mensagem que veio pronta da API (ex.: "Esse telefone já está confirmado nesta sexta.");
 * - `zod`: mensagem do esquema do compartilhado.
 */
export function mensagemDeErro(erros: ValidationErrors | null | undefined): string | null {
  if (!erros) return null;
  for (const chave of ['servidor', 'zod']) {
    const mensagem = erros[chave];
    if (typeof mensagem === 'string' && mensagem) return mensagem;
  }
  return MENSAGEM_PADRAO;
}

/** Título do aviso de erro no topo do formulário: "Falta 1 informação." / "Faltam 2 informações." */
export function resumoDeErros(quantos: number): string {
  return quantos === 1 ? 'Falta 1 informação.' : `Faltam ${quantos} informações.`;
}
