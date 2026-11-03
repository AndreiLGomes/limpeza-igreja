import { describe, expect, it } from 'vitest';
import { hoje } from '../codigo/tempo.js';

describe('hoje() (D1)', () => {
  it('usa o fuso de São Paulo, não o UTC', () => {
    // 02:00 em UTC do dia 16 ainda é 23:00 do dia 15 em São Paulo.
    expect(hoje(new Date('2026-10-16T02:00:00Z'))).toBe('2026-10-15');
    expect(hoje(new Date('2026-10-16T03:00:00Z'))).toBe('2026-10-16');
  });
});
