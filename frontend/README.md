# Front-end — Escala de Limpeza

Telas do app em Angular 22 (componentes *standalone*, *signals*, sem zone.js).

## Comandos

Na raiz do projeto, `npm install` instala tudo. Dentro de `frontend/`:

| Comando | O que faz |
| --- | --- |
| `npm start` | Sobe o app em `http://localhost:4200` (a vitrine fica em `/design-system`) |
| `npm test` | Roda os testes unitários (Vitest) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run tokens` | Gera os estilos e ícones a partir de `../design-system/` |

`start`, `build` e `test` rodam o `npm run tokens` sozinhos antes. Os arquivos gerados
(`src/styles/_tokens.scss`, `src/styles/_components.scss` e `src/app/shared/ui/icon/icons.generated.ts`)
não vão para o git: **para mudar cores, espaços ou ícones, mude o `design-system/`**, nunca esses arquivos.

## Onde está cada coisa

- `src/app/shared/ui/`: componentes do Design System (importe de `@ui`).
- `src/app/shared/forms/`: `validadorZod()` e mensagens de campo (importe de `@forms`).
- `src/app/shared/estado/`: `<app-estado>`, para carregando, erro e conteúdo.
- `src/app/core/`: serviços únicos (tema, nome do app, título da aba, armazenamento).
- `src/app/features/`: uma pasta por tela.
- Tipos, validações, datas, telefone e regras vêm do pacote `@limpeza/shared`.
