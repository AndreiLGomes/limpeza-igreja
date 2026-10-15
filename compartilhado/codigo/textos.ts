/** Ajustes de texto para encaixar no meio de uma frase. */

/** "Sexta, 16 de outubro" → "sexta, 16 de outubro"; "O tempo todo" → "o tempo todo". */
export function inicialMinuscula(texto: string): string {
  return texto.charAt(0).toLocaleLowerCase('pt-BR') + texto.slice(1);
}
