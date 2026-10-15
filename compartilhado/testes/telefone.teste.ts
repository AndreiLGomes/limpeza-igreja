import { describe, expect, it } from 'vitest';
import { ehTelefoneValido, formatarTelefone, soDigitos } from '../codigo/telefone.js';

describe('telefone (C2)', () => {
  it('aceita 10 e 11 dígitos', () => {
    expect(ehTelefoneValido('4733331234')).toBe(true);
    expect(ehTelefoneValido('47999991234')).toBe(true);
  });

  it('recusa 9 e 12 dígitos', () => {
    expect(ehTelefoneValido('479999912')).toBe(false);
    expect(ehTelefoneValido('479999912345')).toBe(false);
  });

  it('remove a máscara', () => {
    expect(soDigitos('(47) 99999-1234')).toBe('47999991234');
    expect(ehTelefoneValido('(47) 99999-1234')).toBe(true);
  });

  it('formata celular e fixo para exibir', () => {
    expect(formatarTelefone('47999991234')).toBe('47 99999-1234');
    expect(formatarTelefone('4733331234')).toBe('47 3333-1234');
    expect(formatarTelefone('(47) 99999-1234')).toBe('47 99999-1234');
  });
});
