import { describe, expect, it } from 'vitest';
import { hoje, horaAgora } from '../codigo/tempo.js';

describe('hoje() (D1)', () => {
  it('usa o fuso de São Paulo, não o UTC', () => {
    // 02:00 em UTC do dia 16 ainda é 23:00 do dia 15 em São Paulo.
    expect(hoje(new Date('2026-10-16T02:00:00Z'))).toBe('2026-10-15');
    expect(hoje(new Date('2026-10-16T03:00:00Z'))).toBe('2026-10-16');
  });
});

describe('horaAgora() (L5)', () => {
  it('devolve HH:MM no fuso de São Paulo', () => {
    // 22:32 UTC é 19:32 em São Paulo (UTC−3); 03:05 UTC do dia 6 é 00:05 em São Paulo.
    expect(horaAgora(new Date('2026-11-05T22:32:00Z'))).toBe('19:32');
    expect(horaAgora(new Date('2026-11-06T03:05:00Z'))).toBe('00:05');
  });
});
