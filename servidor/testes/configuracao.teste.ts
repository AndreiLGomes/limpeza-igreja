import { describe, expect, it } from 'vitest';
import { lerConfiguracao } from '../codigo/configuracao.js';

/** Hash bcrypt de exemplo, só com o formato certo (não é a senha de ninguém). */
const HASH_DE_EXEMPLO = `$2b$12$${'a'.repeat(53)}`;

const AMBIENTE = {
  NODE_ENV: 'development',
  PORTA: '3000',
  URL_DO_BANCO: 'postgres://limpeza:limpeza@localhost:5432/limpeza',
  URL_DO_BANCO_TESTE: 'postgres://limpeza:limpeza@localhost:5432/limpeza_teste',
  SENHA_ORGANIZADOR_HASH: HASH_DE_EXEMPLO,
  ORIGEM_DO_SITE: 'http://localhost:4200',
};

describe('config.ts', () => {
  it('lê um ambiente completo', () => {
    const configuracao = lerConfiguracao(AMBIENTE);
    expect(configuracao.PORTA).toBe(3000);
    expect(configuracao.SENHA_ORGANIZADOR_HASH).toBe(HASH_DE_EXEMPLO);
    expect(configuracao.urlDoBanco).toBe(AMBIENTE.URL_DO_BANCO);
  });

  it('em teste, usa o banco de teste', () => {
    expect(lerConfiguracao({ ...AMBIENTE, NODE_ENV: 'test' }).urlDoBanco).toBe(AMBIENTE.URL_DO_BANCO_TESTE);
  });

  it('O1: o hash da senha é obrigatório', () => {
    expect(() => lerConfiguracao({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: '' })).toThrow(/SENHA_ORGANIZADOR_HASH/);
    expect(() => lerConfiguracao({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: undefined })).toThrow(/SENHA_ORGANIZADOR_HASH/);
  });

  it('O1: recusa senha pura no lugar do hash, sem mostrar o valor no erro', () => {
    expect(() => lerConfiguracao({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: 'minha-senha-secreta' })).toThrow(
      /SENHA_ORGANIZADOR_HASH/,
    );
    expect(() => lerConfiguracao({ ...AMBIENTE, SENHA_ORGANIZADOR_HASH: 'minha-senha-secreta' })).not.toThrow(
      /minha-senha-secreta/,
    );
  });

  it('diz qual variável falta', () => {
    expect(() => lerConfiguracao({ ...AMBIENTE, ORIGEM_DO_SITE: undefined })).toThrow(/ORIGEM_DO_SITE/);
    expect(() => lerConfiguracao({ ...AMBIENTE, URL_DO_BANCO: '' })).toThrow(/URL_DO_BANCO/);
    expect(() => lerConfiguracao({ ...AMBIENTE, NODE_ENV: 'test', URL_DO_BANCO_TESTE: undefined })).toThrow(
      /URL_DO_BANCO_TESTE/,
    );
  });

  it('recusa porta inválida', () => {
    expect(() => lerConfiguracao({ ...AMBIENTE, PORTA: 'abc' })).toThrow(/PORTA/);
  });

  it('na hospedagem, usa a PORT que ela informa quando não há PORTA', () => {
    const { PORTA: _semPorta, ...semPorta } = AMBIENTE;
    expect(lerConfiguracao({ ...semPorta, PORT: '10000' }).PORTA).toBe(10000);
    expect(lerConfiguracao({ ...AMBIENTE, PORT: '10000' }).PORTA).toBe(3000);
  });

  it('proxies confiáveis: nenhum por padrão, e só números inteiros', () => {
    expect(lerConfiguracao(AMBIENTE).PROXIES_CONFIAVEIS).toBe(0);
    expect(lerConfiguracao({ ...AMBIENTE, PROXIES_CONFIAVEIS: '1' }).PROXIES_CONFIAVEIS).toBe(1);
    expect(() => lerConfiguracao({ ...AMBIENTE, PROXIES_CONFIAVEIS: 'true' })).toThrow(/PROXIES_CONFIAVEIS/);
  });
});
