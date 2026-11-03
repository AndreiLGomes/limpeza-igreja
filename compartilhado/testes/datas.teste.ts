import { describe, expect, it } from 'vitest';
import {
  dataNaFrase, dataPorExtenso, ehDataValida, ehPassada, hora, horario, proximoDiaDaSemana, somarDias,
} from '../codigo/datas.js';

describe('datas (D2, D4)', () => {
  it('escreve a data por extenso', () => {
    expect(dataPorExtenso('2026-10-16')).toBe('Sexta, 16 de outubro');
    expect(dataPorExtenso('2026-10-17')).toBe('Sábado, 17 de outubro');
    expect(dataPorExtenso('2027-03-01')).toBe('Segunda, 1 de março');
  });

  it('escreve a data no meio da frase, em minúscula', () => {
    expect(dataNaFrase('2026-10-16')).toBe('sexta, 16 de outubro');
  });

  it('escreve a hora curta', () => {
    expect(hora('19:00')).toBe('19h');
    expect(hora('19:30')).toBe('19h30');
    expect(hora('07:05')).toBe('7h05');
    expect(horario('19:00', '21:00')).toBe('19h às 21h');
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

  it('acha o próximo dia da semana (a própria data, se já for esse dia)', () => {
    // 2026-11-04 é quarta; 2026-11-05 é quinta.
    expect(proximoDiaDaSemana('2026-11-04', 'Quinta')).toBe('2026-11-05');
    expect(proximoDiaDaSemana('2026-11-05', 'Quinta')).toBe('2026-11-05');
    expect(proximoDiaDaSemana('2026-11-06', 'Quinta')).toBe('2026-11-12');
    expect(proximoDiaDaSemana('2026-11-05', 'Segunda')).toBe('2026-11-09');
    expect(proximoDiaDaSemana('2026-12-31', 'Sábado')).toBe('2027-01-02');
  });

  it('confere se a data existe', () => {
    expect(ehDataValida('2026-10-16')).toBe(true);
    expect(ehDataValida('2026-02-30')).toBe(false);
    expect(ehDataValida('16/10/2026')).toBe(false);
  });
});
