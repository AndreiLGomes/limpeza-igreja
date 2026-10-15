/**
 * Acesso seguro ao localStorage/sessionStorage: em aba anônima, com cookies bloqueados ou cota
 * cheia, o navegador pode dar erro. Aqui todo acesso fica dentro de try/catch (docs/06).
 */
type Tipo = 'local' | 'sessao';

function armazenamento(tipo: Tipo): Storage | undefined {
  try {
    return tipo === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

export function ler(tipo: Tipo, chave: string): string | null {
  try {
    return armazenamento(tipo)?.getItem(chave) ?? null;
  } catch {
    return null;
  }
}

export function gravar(tipo: Tipo, chave: string, valor: string): void {
  try {
    armazenamento(tipo)?.setItem(chave, valor);
  } catch {
    // Sem armazenamento: o app continua funcionando, só não lembra a escolha.
  }
}

export function apagar(tipo: Tipo, chave: string): void {
  try {
    armazenamento(tipo)?.removeItem(chave);
  } catch {
    // Idem.
  }
}
