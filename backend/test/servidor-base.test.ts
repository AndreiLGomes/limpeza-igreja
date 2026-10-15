import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { mensagemDoErro } from '@limpeza/shared';
import { ErroApp } from '../src/comum/erros.js';
import { config } from '../src/config.js';
import { rotaNaoEncontrada, tratarErros } from '../src/http/tratar-erros.js';
import { criarAppDeTeste } from './ajuda/app.js';

describe('GET /api/saude', () => {
  it('responde { ok: true }', async () => {
    const resposta = await request(criarAppDeTeste()).get('/api/saude');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ok: true });
  });

  it('tem os cabeçalhos de segurança do helmet e não anuncia o Express', async () => {
    const resposta = await request(criarAppDeTeste()).get('/api/saude');
    expect(resposta.headers['x-content-type-options']).toBe('nosniff');
    expect(resposta.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('libera só a origem do front-end', async () => {
    const app = criarAppDeTeste();
    const liberada = await request(app).get('/api/saude').set('Origin', config.ORIGEM_FRONTEND);
    expect(liberada.headers['access-control-allow-origin']).toBe(config.ORIGEM_FRONTEND);

    const outra = await request(app).get('/api/saude').set('Origin', 'https://site-estranho.com');
    expect(outra.headers['access-control-allow-origin']).not.toBe('https://site-estranho.com');
  });
});

describe('formato de erro (docs/04-api.md)', () => {
  /** App mínimo com as mesmas peças de erro do servidor e rotas que falham de propósito. */
  function appQueFalha() {
    const app = express();
    app.get('/sem-vaga', () => {
      throw new ErroApp('SEM_VAGA');
    });
    app.get('/vagas', async () => {
      throw new ErroApp('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados: 4 });
    });
    app.get('/inesperado', async () => {
      throw new Error('falha do banco: telefone 47999991234');
    });
    app.use(rotaNaoEncontrada);
    app.use(tratarErros);
    return app;
  }

  it('ErroApp("SEM_VAGA") vira 409 com código e mensagem do catálogo', async () => {
    const resposta = await request(appQueFalha()).get('/sem-vaga');
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ codigo: 'SEM_VAGA', mensagem: 'As vagas desta sexta acabaram.' });
  });

  it('erro de rota async com extras (S8)', async () => {
    const resposta = await request(appQueFalha()).get('/vagas');
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      codigo: 'VAGAS_MENOR_QUE_CONFIRMADOS',
      mensagem: mensagemDoErro('VAGAS_MENOR_QUE_CONFIRMADOS', { confirmados: 4 }),
      confirmados: 4,
    });
  });

  it('erro inesperado vira 500 sem nenhum detalhe técnico', async () => {
    const resposta = await request(appQueFalha()).get('/inesperado');
    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      codigo: 'ERRO_INTERNO',
      mensagem: 'Algo deu errado. Tente de novo em instantes.',
    });
  });

  it('endereço que não existe responde em JSON', async () => {
    const resposta = await request(criarAppDeTeste()).get('/api/nao-existe');
    expect(resposta.status).toBe(404);
    expect(resposta.body.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });

  it('JSON quebrado vira 400 DADOS_INVALIDOS', async () => {
    const resposta = await request(criarAppDeTeste())
      .post('/api/saude')
      .set('Content-Type', 'application/json')
      .send('{ quebrado');
    expect(resposta.status).toBe(400);
    expect(resposta.body.codigo).toBe('DADOS_INVALIDOS');
  });

  it('corpo maior que 10 KB é recusado', async () => {
    const resposta = await request(criarAppDeTeste())
      .post('/api/saude')
      .send({ texto: 'a'.repeat(11 * 1024) });
    expect(resposta.status).toBe(400);
    expect(resposta.body.codigo).toBe('DADOS_INVALIDOS');
  });
});

describe('limite geral de escritas', () => {
  it('a 61ª escrita no mesmo minuto recebe 429 com tentarEmSegundos', async () => {
    const app = criarAppDeTeste();
    for (let i = 0; i < 60; i++) {
      const resposta = await request(app).post('/api/qualquer');
      expect(resposta.status, `escrita ${i + 1}`).toBe(404);
    }
    const bloqueada = await request(app).post('/api/qualquer');
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.codigo).toBe('MUITAS_TENTATIVAS');
    expect(bloqueada.body.tentarEmSegundos).toBeGreaterThan(0);
    expect(bloqueada.body.tentarEmSegundos).toBeLessThanOrEqual(60);
  });

  it('leituras não contam', async () => {
    const app = criarAppDeTeste({ escritasPorMinuto: 1 });
    for (let i = 0; i < 5; i++) {
      expect((await request(app).get('/api/saude')).status).toBe(200);
    }
  });
});
