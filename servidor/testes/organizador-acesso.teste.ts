/** Organizador: entrar, sair e sessão (O1, O2, O3, O4, O6). */
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { SENHA_BLOQUEIO_SEGUNDOS, SENHA_TENTATIVAS_MAX } from '@limpeza/compartilhado';
import { bd } from '../codigo/banco/cliente.js';
import { sessoesOrganizador } from '../codigo/banco/esquema.js';
import { BYTES_DO_TOKEN, gerarToken, hashDeToken } from '../codigo/comum/seguranca.js';
import { criarAplicacaoDeTeste } from './ajuda/aplicacao.js';
import { SENHA_DE_TESTE } from './ajuda/ambiente.js';
import { limparBanco } from './ajuda/banco.js';
import { comoOrganizador } from './ajuda/organizador.js';

const aplicacao = criarAplicacaoDeTeste();
const entrar = (senha: string) => request(aplicacao).post('/api/organizador/entrar').send({ senha });
const listarComToken = (token?: string) => {
  const pedido = request(aplicacao).get('/api/organizador/dias');
  return token === undefined ? pedido : pedido.set('Authorization', `Bearer ${token}`);
};

beforeEach(limparBanco);

describe('POST /api/organizador/entrar (O1, O2, O3)', () => {
  it('senha certa → token de 256 bits e validade de 12 horas; o banco guarda só o hash', async () => {
    const resposta = await entrar(SENHA_DE_TESTE);
    expect(resposta.status).toBe(200);
    expect(Buffer.from(resposta.body.token, 'base64url')).toHaveLength(32);

    const horas = (new Date(resposta.body.expiraEm).getTime() - Date.now()) / 3_600_000;
    // A validade é calculada pelo relógio do banco; a folga cobre pequena diferença entre os relógios.
    expect(horas).toBeGreaterThan(11.9);
    expect(horas).toBeLessThan(12.1);

    const [sessao] = await bd.select().from(sessoesOrganizador);
    expect(sessao?.tokenHash).toBe(hashDeToken(resposta.body.token));
  });

  it('senha errada → 401 com a mensagem das regras', async () => {
    const resposta = await entrar('senha-errada');
    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({
      codigo: 'SENHA_INCORRETA',
      mensagem: 'Senha incorreta. Peça a senha para quem administra o app.',
    });
  });

  it('senha vazia → 400', async () => {
    expect((await entrar('')).status).toBe(400);
  });

  it('6ª senha errada seguida → 429 com tentarEmSegundos; até a certa fica bloqueada', async () => {
    for (let i = 1; i <= SENHA_TENTATIVAS_MAX; i++) {
      expect((await entrar(`errada-${i}`)).status, `tentativa ${i}`).toBe(401);
    }
    const bloqueada = await entrar('errada-6');
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.codigo).toBe('MUITAS_TENTATIVAS');
    expect(bloqueada.body.tentarEmSegundos).toBeGreaterThan(0);
    expect(bloqueada.body.tentarEmSegundos).toBeLessThanOrEqual(SENHA_BLOQUEIO_SEGUNDOS);
    expect((await entrar(SENHA_DE_TESTE)).status).toBe(429);
  });

  it('"seguidas": acertar no meio zera a contagem', async () => {
    for (let i = 1; i < SENHA_TENTATIVAS_MAX; i++) await entrar(`errada-${i}`);
    expect((await entrar(SENHA_DE_TESTE)).status).toBe(200);
    for (let i = 1; i < SENHA_TENTATIVAS_MAX; i++) {
      expect((await entrar(`errada-de-novo-${i}`)).status).toBe(401);
    }
  });
});

describe('Sessão (O2, O4, O6)', () => {
  it('sem token, token inválido ou expirado → 401 SESSAO_EXPIRADA', async () => {
    const expirado = gerarToken(BYTES_DO_TOKEN);
    await bd.insert(sessoesOrganizador).values({
      tokenHash: hashDeToken(expirado),
      expiraEm: new Date(Date.now() - 1000),
    });

    for (const token of [undefined, 'token-inventado', expirado]) {
      const resposta = await listarComToken(token);
      expect(resposta.status, String(token)).toBe(401);
      expect(resposta.body).toEqual({
        codigo: 'SESSAO_EXPIRADA',
        mensagem: 'Entre de novo na área de quem organiza.',
      });
    }
  });

  it('cabeçalho sem "Bearer" não vale', async () => {
    const org = await comoOrganizador(aplicacao);
    const resposta = await request(aplicacao).get('/api/organizador/dias').set('Authorization', org.token);
    expect(resposta.status).toBe(401);
  });

  it('com token válido → 200', async () => {
    const org = await comoOrganizador(aplicacao);
    expect((await org.get('/api/organizador/dias')).status).toBe(200);
  });

  it('depois de sair, o token não vale mais', async () => {
    const org = await comoOrganizador(aplicacao);
    expect((await org.post('/api/organizador/sair')).status).toBe(204);
    expect((await org.get('/api/organizador/dias')).status).toBe(401);
  });

  it('O4: todos os endereços do organizador exigem a sessão', async () => {
    const id = '6f1c1b0e-8a3e-4c1a-9b7d-2f4e5a6b7c8d';
    const pedidos = [
      request(aplicacao).post('/api/organizador/sair'),
      request(aplicacao).get('/api/organizador/dias'),
      request(aplicacao).get(`/api/organizador/dias/${id}`),
      request(aplicacao).get('/api/organizador/sugestao-tarefas'),
      request(aplicacao).post('/api/organizador/dias').send({}),
      request(aplicacao).put(`/api/organizador/dias/${id}`).send({}),
      request(aplicacao).delete(`/api/organizador/dias/${id}`),
      request(aplicacao).delete(`/api/organizador/dias/${id}/pessoas/${id}`),
      request(aplicacao).post(`/api/organizador/dias/${id}/pessoas`).send({}),
    ];
    for (const [i, pedido] of pedidos.entries()) {
      const resposta = await pedido;
      expect(resposta.status, `pedido ${i + 1}`).toBe(401);
    }
  });
});
