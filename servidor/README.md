# Servidor — Limpeza na Sexta

A API: Node 24 + Express 5 + TypeScript + PostgreSQL 18 (Drizzle).

## Primeira vez

Na raiz do projeto:

```bash
npm install
docker compose up -d
```

Dentro de `servidor/`:

1. Copie `.env.exemplo` para `.env`.
2. Gere o hash da senha de organizador e cole a linha mostrada no `.env`:

   ```bash
   npm run gerar-hash-senha
   ```

   O comando pede a senha duas vezes, sem mostrá-la na tela, e imprime
   `SENHA_ORGANIZADOR_HASH='...'`. A senha pura não fica salva em lugar nenhum; guarde-a com
   quem organiza. **O `.env` nunca vai para o git.**
3. Crie as tabelas e, se quiser, os dados de exemplo:

   ```bash
   npm run migrar
   npm run dados-de-exemplo
   ```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run desenvolver` | Sobe o servidor em `http://localhost:3000/api` e reinicia ao salvar |
| `npm test` | Roda os testes (recria o banco `limpeza_teste` do zero; precisa do Docker no ar) |
| `npm run build` / `npm start` | Compila para `compilado/` e roda a versão compilada |
| `npm run migrar` | Cria ou atualiza as tabelas no banco do `.env` |
| `npm run migracao:gerar` | Gera uma migração nova depois de mudar `codigo/banco/esquema.ts` |
| `npm run dados-de-exemplo` | Apaga os dados do banco de desenvolvimento e cria os de exemplo (nunca em produção) |
| `npm run gerar-hash-senha` | Gera o hash bcrypt da senha de organizador |

Para trocar a senha de organizador: gere um hash novo, troque no `.env` e reinicie o servidor.

## Onde está cada coisa

A organização segue `docs/10-arquitetura-e-reaproveitamento.md` (pasta `docs/` só no computador do Andrei):

- `codigo/aplicacao.ts`: monta o Express (usado pelo servidor e pelos testes).
- `codigo/configuracao.ts`: o único lugar que lê as variáveis de ambiente.
- `codigo/http/`: peças usadas por várias rotas (validar, erros, registro, limites, exigir organizador).
- `codigo/comum/`: erros, mapeadores (o que sai pela API), segurança e `hoje()`.
- `codigo/modulos/`: cada área com `rotas.ts`, `servico.ts` (regras) e `repositorio.ts` (banco).
- `testes/ajuda/`: fábricas de dados, banco de teste e entrada de organizador para os testes.
- Os testes terminam em `.teste.ts`.
