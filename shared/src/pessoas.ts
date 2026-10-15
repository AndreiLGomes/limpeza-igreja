/**
 * Iniciais para o Avatar: primeira letra do primeiro e do último nome.
 * "Andrei Luciano Gomes" → "AG"; "Andrei" → "A".
 */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0];
  if (!primeira) return '';
  const ultima = partes.length > 1 ? partes[partes.length - 1] : undefined;
  return `${primeira.charAt(0)}${ultima?.charAt(0) ?? ''}`.toLocaleUpperCase('pt-BR');
}
