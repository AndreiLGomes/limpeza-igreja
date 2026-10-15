import { describe, expect, it } from 'vitest';
import {
  dataPorExtenso, ehDataValida, ehPassada, ehSexta, hora, horario, proximaSexta, somarDias,
} from '../src/datas.js';

describe('datas (D2, D4, S6)', () => {
  it('escreve a data por extenso', () => {
    expect(dataPorExtenso('2026-10-16')).toBe('Sexta, 16 de outubro');
    expect(dataPorExtenso('2026-10-17')).toBe('Sábado, 17 de outubro');
    expect(dataPorExtenso('2027-03-01')).toBe('Segunda, 1 de março');
  });

  it('escreve a hora curta', () => {
    expect(hora('19:00')).toBe('19h');
    expect(hora('19:30')).toBe('19h30');
    expect(hora('07:05')).toBe('7h05');
    expect(horario('19:00', '21:00')).toBe('19h às 21h');
  });

  it('sabe se a data é sexta-feira', () => {
    expect(ehSexta('2026-10-16')).toBe(true);
    expect(ehSexta('2026-10-17')).toBe(false);
  });

  it('hoje não é passada; ontem é (D2)', () => {
    expect(ehPassada('2026-10-15', '2026-10-15')).toBe(false);
    expect(ehPassada('2026-10-14', '2026-10-15')).toBe(true);
    expect(ehPassada('2026-10-16', '2026-10-15')).toBe(false);
  });

  it('soma dias, virando mês e ano', () => {
    expect(somarDias('2026-10-16', 7)).toBe('2026-10-23');
    expect(somarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(somarDias('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('acha a próxima sexta (a própria data, se já for sexta)', () => {
    expect(proximaSexta('2026-10-15')).toBe('2026-10-16');
    expect(proximaSexta('2026-10-16')).toBe('2026-10-16');
    expect(proximaSexta('2026-10-17')).toBe('2026-10-23');
  });

  it('confere se a data existe', () => {
    expect(ehDataValida('2026-10-16')).toBe(true);
    expect(ehDataValida('2026-02-30')).toBe(false);
    expect(ehDataValida('16/10/2026')).toBe(false);
  });
});
