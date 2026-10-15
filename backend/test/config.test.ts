import { describe, expect, it } from 'vitest';
import { lerConfig } from '../src/config.js';

/** Hash bcrypt de exemplo, só com o formato certo (não é a senha de ninguém). */
const HASH_DE_EXEMPLO = `$2b$12$${'a'.repeat(53)}`;

const AMBIENTE = {
  NODE_ENV: 'development',
  PORTA: '3000',
  DATABASE_URL: 'postgres://limpeza:limpeza@localhost:5432/limpeza',
  DATABASE_URL_TESTE: 'postgres://limpeza:limpeza@localhost:5432/limpeza_teste',
  SENHA_ORGANIZADOR_HASH: HASH_DE_EXEMPLO,
  ORIGEM_FRONTEND: 'http://localhost:4200',
};

describe('config.ts', () => {
  it('lê um ambiente completo', () => {
    const config = lerConfig(AMBIENTE);
    expect(config.PORTA).toBe(3000);
    expect(config.SENHA_ORGANIZADOR_HASH).toBe(HASH_DE_EXEMPLO);
    expect(config.urlDoBanco).toBe(AMBIENTE.DATABASE_URL);
  });

  it('em teste, usa o banco de teste', () => {
    expect(lerConfig({ ...AMBIENTE, NODE_ENV: 'test' }).urlDoBanco).toBe(AMBIENTE.DATABASE_URL_TESTE);
  });

  it('O1: o hash da senha é obrigatório', () => {
    expect(() => lerConfig({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: '' })).toThrow(/SENHA_ORGANIZADOR_HASH/);
    expect(() => lerConfig({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: undefined })).toThrow(/SENHA_ORGANIZADOR_HASH/);
  });

  it('O1: recusa senha pura no lugar do hash, sem mostrar o valor no erro', () => {
    expect(() => lerConfig({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: 'minha-senha-secreta' })).toThrow(
      /SENHA_ORGANIZADOR_HASH/,
    );
    expect(() => lerConfig({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: 'minha-senha-secreta' })).not.toThrow(
      /minha-senha-secreta/,
    );
  });

  it('diz qual variável falta', () => {
    expect(() => lerConfig({ ...AMBIENTE, ORIGEM_FRONTEND: undefined })).toThrow(/ORIGEM_FRONTEND/);
    expect(() => lerConfig({ ...AMBIENTE, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
    expect(() => lerConfig({ ...AMBIENTE, NODE_ENV: 'test', DATABASE_URL_TESTE: undefined })).toThrow(
      /DATABASE_URL_TESTE/,
    );
  });

  it('recusa porta inválida', () => {
    expect(() => lerConfig({ ...AMBIENTE, PORTA: 'abc' })).toThrow(/PORTA/);
  });
});
