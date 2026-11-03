import { describe, expect, it } from 'vitest';
import { BYTES_DO_CODIGO, BYTES_DO_TOKEN, gerarToken, hashDeToken } from '../codigo/comum/seguranca.js';

describe('segurança', () => {
  it('código de cancelamento com 128 bits e token com 256 bits, sempre diferentes', () => {
    expect(Buffer.from(gerarToken(BYTES_DO_CODIGO), 'base64url')).toHaveLength(16);
    expect(Buffer.from(gerarToken(BYTES_DO_TOKEN), 'base64url')).toHaveLength(32);
    expect(gerarToken(BYTES_DO_TOKEN)).not.toBe(gerarToken(BYTES_DO_TOKEN));
  });

  it('hash é sempre o mesmo para o mesmo valor e não contém o valor', () => {
    const hash = hashDeToken('abc');
    expect(hash).toBe(hashDeToken('abc'));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('abc');
  });
});
