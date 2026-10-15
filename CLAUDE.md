# Limpeza Igreja — instruções para o Claude Code

App para organizar a limpeza da igreja às sextas-feiras: quem vem, quando vem e o que já foi feito.
Projeto pessoal do Andrei (dev front-end, Angular). **Ainda não existe código**: você vai
construir tudo a partir da documentação.

Responda e escreva os textos da interface em **português do Brasil**.

## Comece por aqui

1. Leia `docs/00-LEIA-PRIMEIRO.md` e, depois, os documentos na ordem indicada lá.
2. Siga `docs/08-plano-de-tarefas.md` **etapa por etapa**. Não pule etapas.
3. Ao terminar uma etapa: rode os testes, marque `[x]` no plano e faça o commit.

## Regras principais (o detalhe está em `docs/`)

- **Reaproveite tudo: cada coisa é escrita uma vez só.** Tipos, validações, mensagens, datas,
  telefone e regras puras ficam em `shared/` e são usados pelo front e pelo back. Middlewares,
  mapeadores e fábricas de teste também são peças únicas. Antes de escrever, procure se já existe;
  se existe algo parecido, generalize. **Nunca copie e cole código.** Veja `docs/10-arquitetura-e-reaproveitamento.md`.
- **`docs/02-regras-de-negocio.md` manda.** Não invente regra; o que não está escrito está em
  `docs/09-decisoes-em-aberto.md` ou deve ser **perguntado ao Andrei**.
- **Visual:** siga `design-system/` (cores, componentes, telas de exemplo). Nenhuma cor, tamanho
  ou espaçamento escrito à mão no front: tudo vem de `design-system/tokens.json` e `components.css`.
- **Celular primeiro (375px)**, temas claro e escuro, sem rolagem lateral, toque mínimo de 44px.
- **LGPD:** telefone e observação **nunca** saem pela parte pública da API.
- **Segredos:** a senha de organizador fica só no servidor, com hash, numa variável de ambiente.
  Nunca no código nem no repositório.
- Leia a seção **"Armadilhas conhecidas"** de `docs/06-frontend.md` antes de escrever o front.
- Se uma decisão mudar durante o trabalho, **atualize o documento** correspondente.

## Git

- **Não adicione o Claude como autor ou coautor.** Nada de `Co-Authored-By: Claude` nem
  "Generated with Claude Code" em commits ou pull requests. Os commits são só do Andrei.
  (Também configurado em `.claude/settings.json`, com `attribution` vazio.)
- Mensagens de commit em português, curtas, dizendo o que mudou.

## Tecnologias

Angular 22 · Node.js 22.22.3+ (ou 24.15+) · Express 5 + TypeScript · Zod · Drizzle · PostgreSQL 18 ·
Vitest · Playwright. Versões e motivos em `docs/10-arquitetura-e-reaproveitamento.md`.
