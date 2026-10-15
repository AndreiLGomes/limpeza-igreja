import type { Express } from 'express';
import request from 'supertest';
import { SENHA_DE_TESTE } from './ambiente.js';

/**
 * Entra como organizador (com a senha dos testes) e devolve as requisições já com o token.
 * Ex.: const org = await comoOrganizador(app); await org.get('/api/organizador/dias');
 */
export async function comoOrganizador(app: Express) {
  const resposta = await request(app).post('/api/organizador/entrar').send({ senha: SENHA_DE_TESTE });
  if (resposta.status !== 200) throw new Error(`Não foi possível entrar como organizador (${resposta.status}).`);
  const token: string = resposta.body.token;
  const comToken = (teste: request.Test) => teste.set('Authorization', `Bearer ${token}`);

  return {
    token,
    get: (url: string) => comToken(request(app).get(url)),
    post: (url: string, corpo: object = {}) => comToken(request(app).post(url).send(corpo)),
    put: (url: string, corpo: object) => comToken(request(app).put(url).send(corpo)),
    delete: (url: string) => comToken(request(app).delete(url)),
  };
}
