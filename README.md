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

Esse comando sobe o banco, confere o `servidor/.env`, aplica as migrações e liga o servidor (porta 3000) e o site
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

## Colocar no ar

O site fica na **Vercel**, o servidor na **Render** e o banco na **Neon**. Os três têm plano gratuito. No plano
gratuito, a Render desliga o servidor quando ninguém usa: o primeiro acesso depois disso pode levar cerca de 50 segundos.

Nenhuma senha ou endereço de banco vai para o repositório: esses valores são colados só nos painéis.

### 1. Banco (Neon)

1. Crie um projeto em [neon.tech](https://neon.tech), na região **AWS US East (N. Virginia)**, perto do servidor.
2. Copie o endereço de conexão **direto** (sem `-pooler` no nome). Ele é o `URL_DO_BANCO` do passo 3.

### 2. Código (GitHub)

Crie um repositório vazio no GitHub e envie o código. As pastas `docs/` e `.claude/` não vão junto.

### 3. Servidor (Render)

1. Em [render.com](https://render.com), escolha **New > Blueprint** e selecione o repositório. O `render.yaml` já
   traz os comandos e as configurações.
2. Gere o hash da senha de organizador no seu computador, com `npm run gerar-hash-senha --workspace servidor`.
3. Preencha no painel:
   - `URL_DO_BANCO`: o endereço copiado da Neon;
   - `SENHA_ORGANIZADOR_HASH`: o hash gerado (nunca a senha pura);
   - `ORIGEM_DO_SITE`: o endereço do site na Vercel, sem barra no fim. Se ainda não souber, use
     `https://limpeza-igreja.vercel.app` e corrija depois do passo 4.
4. Confira se `https://limpeza-igreja-api.onrender.com/api/saude` responde `{"ok":true}`. As tabelas são criadas
   sozinhas a cada início do servidor.

Se a Render der outro endereço ao serviço, troque-o em `site/codigo/aplicacao/nucleo/ambiente.producao.ts` e envie a
mudança ao GitHub.

### 4. Site (Vercel)

1. Em [vercel.com](https://vercel.com), importe o repositório sem mudar nada: o `vercel.json` já traz os comandos.
2. Copie o endereço que a Vercel mostrar. Se for diferente do que está em `ORIGEM_DO_SITE`, corrija na Render.

### 5. Conferir

1. Abra o site, confirme presença numa limpeza e entre como organizador.
2. Erre a senha até aparecer o aviso de muitas tentativas e, em seguida, tente entrar pelo celular usando a rede
   móvel. Se o celular também estiver bloqueado, o valor de `PROXIES_CONFIAVEIS` na Render está errado para a
   hospedagem: o servidor não está enxergando o endereço de cada pessoa.

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
