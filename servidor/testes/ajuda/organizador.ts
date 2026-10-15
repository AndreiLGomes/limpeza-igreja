import type { Express } from 'express';
import request from 'supertest';
import { SENHA_DE_TESTE } from './ambiente.js';

/**
 * Entra como organizador (com a senha dos testes) e devolve as requisições já com o token.
 * Ex.: const org = await comoOrganizador(aplicacao); await org.get('/api/organizador/dias');
 */
export async function comoOrganizador(aplicacao: Express) {
  const resposta = await request(aplicacao).post('/api/organizador/entrar').send({ senha: SENHA_DE_TESTE });
  if (resposta.status !== 200) throw new Error(`Não foi possível entrar como organizador (${resposta.status}).`);
  const token: string = resposta.body.token;
  const comToken = (teste: request.Test) => teste.set('Authorization', `Bearer ${token}`);

  return {
    token,
    get: (url: string) => comToken(request(aplicacao).get(url)),
    post: (url: string, corpo: object = {}) => comToken(request(aplicacao).post(url).send(corpo)),
    put: (url: string, corpo: object) => comToken(request(aplicacao).put(url).send(corpo)),
    delete: (url: string) => comToken(request(aplicacao).delete(url)),
  };
}
