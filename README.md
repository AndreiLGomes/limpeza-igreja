# Limpeza da Igreja

App para organizar a limpeza da igreja: quem vem, quando vem e o que já foi feito.

> Projeto pessoal. Não é um aplicativo oficial da Congregação Cristã no Brasil.

## Situação

| Parte | Situação |
| --- | --- |
| Análise e documentação (`docs/`) | ✅ Pronta |
| Design System (`design-system/`) | ✅ Pronto |
| Pacote compartilhado (`compartilhado/`) | ✅ Pronto |
| Servidor (`servidor/`: Node + Express + PostgreSQL) | ✅ Pronto (API pública e do organizador) |
| Site (`site/`: Angular 22) | ✅ Pronto (telas públicas e área do organizador) |

## Como rodar do zero

### 1. O que instalar antes

- **Node.js 24.15 ou mais novo** (ou 22.22.3+). Confira com `node --version`.
- **Docker Desktop**, para o banco PostgreSQL. No Windows, a virtualização precisa estar ligada na BIOS
  (SVM na AMD, VT-x na Intel).

### 2. Preparar (só na primeira vez)

Na pasta do projeto:

```bash
npm install
```

```bash
docker compose up -d --wait
```

Crie o `servidor/.env` a partir do exemplo (ele **nunca** vai para o git):

```bash
cp servidor/.env.exemplo servidor/.env
```

Gere o hash da senha de organizador. O comando pede a senha e mostra uma linha
`SENHA_ORGANIZADOR_HASH=...`: cole essa linha no `servidor/.env`. A senha pura não fica guardada em lugar nenhum.

```bash
npm run gerar-hash-senha --workspace servidor
```

Crie as tabelas e, se quiser, coloque limpezas de exemplo:

```bash
npm run migrar --workspace servidor
```

```bash
npm run dados-de-exemplo --workspace servidor
```

> `dados-de-exemplo` **apaga tudo** do banco de desenvolvimento antes de colocar os exemplos.

### 3. Trabalhar no dia a dia

```bash
npm run desenvolver
```

Esse comando sobe o banco, confere o `servidor/.env`, e liga o servidor (porta 3000) e o site
(<http://localhost:4200>) juntos. `Ctrl+C` para os dois. A área de quem organiza fica em
<http://localhost:4200/organizar>.

### 4. Testes

Testes do compartilhado, do servidor e do site (o banco precisa estar ligado):

```bash
npm test
```

Testes de ponta a ponta (abrem o site num navegador de verdade). Na primeira vez, instale o navegador:

```bash
npx --workspace site playwright install chromium
```

```bash
npm run testes:ponta-a-ponta --workspace site
```

### 5. Compilar para publicar

```bash
npm run build
```

O servidor compilado fica em `servidor/compilado/` (rode com `npm start --workspace servidor`) e o site em
`site/compilado/`.

## Pastas

| Pasta | O que tem |
| --- | --- |
| `compartilhado/` | Tipos, validações, mensagens, datas e regras usadas pelo site e pelo servidor |
| `servidor/` | API em Express + Drizzle + PostgreSQL |
| `site/` | Site em Angular (testes de ponta a ponta em `site/ponta-a-ponta/`) |
| `design-system/` | Cores, componentes e telas de exemplo que o site segue |
| `comandos/` | O `npm run desenvolver` |

## Como construir com o Claude Code

Abra esta pasta no Claude Code. Ele lê o `CLAUDE.md` sozinho e segue o plano em
`docs/08-plano-de-tarefas.md`. Para entender o projeto, comece por `docs/00-LEIA-PRIMEIRO.md`
(a pasta `docs/` fica só no computador de quem desenvolve; ela não vai para o GitHub).
