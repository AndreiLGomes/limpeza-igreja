import { TELEFONE_MAX_DIGITOS, TELEFONE_MIN_DIGITOS } from './limites.js';

/** Tira tudo que não é número: "(47) 99999-1234" → "47999991234". */
export function soDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/** C2: celular ou fixo do Brasil com DDD (10 ou 11 dígitos depois de tirar a máscara). */
export function ehTelefoneValido(texto: string): boolean {
  const digitos = soDigitos(texto);
  return digitos.length >= TELEFONE_MIN_DIGITOS && digitos.length <= TELEFONE_MAX_DIGITOS;
}

/**
 * Formata enquanto a pessoa digita, parando no 11º número (C2): "479999" → "47 9999",
 * "4733331234" → "47 3333-1234" (fixo) e "47999991234" → "47 99999-1234" (celular).
 * É a ÚNICA regra do formato do telefone: o formatarTelefone() usa esta também.
 */
export function formatarEnquantoDigita(texto: string): string {
  const digitos = soDigitos(texto).slice(0, TELEFONE_MAX_DIGITOS);
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  if (!numero) return ddd;
  // Com até 8 números depois do DDD, o hífen vem depois do 4º (fixo); com 9, depois do 5º (celular).
  const corte = numero.length > 8 ? 5 : 4;
  if (numero.length <= corte) return `${ddd} ${numero}`;
  return `${ddd} ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

/**
 * Formata para exibir: "47999991234" → "47 99999-1234" e "4733331234" → "47 3333-1234".
 * Se não for um telefone válido, devolve só os números, sem inventar formato.
 */
export function formatarTelefone(texto: string): string {
  const digitos = soDigitos(texto);
  return ehTelefoneValido(digitos) ? formatarEnquantoDigita(digitos) : digitos;
}
