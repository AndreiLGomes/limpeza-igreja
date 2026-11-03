import { describe, expect, it } from 'vitest';
import { primeiraLimpezaDeExemplo } from '../codigo/banco/exemplos.js';

describe('dados de exemplo', () => {
  it('a primeira limpeza é a próxima quinta DEPOIS de hoje, nunca hoje', () => {
    expect(primeiraLimpezaDeExemplo('2026-11-04')).toBe('2026-11-05'); // quarta → quinta
    expect(primeiraLimpezaDeExemplo('2026-11-05')).toBe('2026-11-12'); // quinta → a quinta seguinte
  });
});
