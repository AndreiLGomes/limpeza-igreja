import { describe, expect, it } from 'vitest';
import { iniciais } from '../codigo/pessoas.js';

describe('iniciais', () => {
  it('um nome: só a primeira letra', () => {
    expect(iniciais('Andrei')).toBe('A');
  });

  it('dois nomes: primeiro e último', () => {
    expect(iniciais('João Silva')).toBe('JS');
  });

  it('três nomes: primeiro e último', () => {
    expect(iniciais('Andrei Luciano Gomes')).toBe('AG');
  });

  it('ignora espaços sobrando e deixa em maiúscula', () => {
    expect(iniciais('  maria   rocha ')).toBe('MR');
    expect(iniciais('')).toBe('');
  });
});
