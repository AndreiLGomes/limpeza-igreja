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
 * Formata para exibir: "47999991234" → "47 99999-1234" e "4733331234" → "47 3333-1234".
 * Se não for um telefone válido, devolve só os números, sem inventar formato.
 */
export function formatarTelefone(texto: string): string {
  const digitos = soDigitos(texto);
  if (!ehTelefoneValido(digitos)) return digitos;
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const corte = numero.length - 4;
  return `${ddd} ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}
