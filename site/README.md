# Site — Escala de Limpeza

As telas do app em Angular 22 (componentes *standalone*, *signals*, sem zone.js).

## Comandos

Na raiz do projeto, `npm install` instala tudo. Dentro de `site/`:

| Comando | O que faz |
| --- | --- |
| `npm start` | Sobe o site em `http://localhost:4200` (a vitrine fica em `/vitrine`) |
| `npm test` | Roda os testes (Vitest); eles terminam em `.teste.ts` |
| `npm run build` | Gera a versão de produção em `compilado/` |
| `npm run gerar-estilos` | Gera os estilos e ícones a partir de `../design-system/` |

`start`, `build` e `test` rodam o `npm run gerar-estilos` sozinhos antes. Os arquivos gerados
(`codigo/estilos/_variaveis.scss`, `codigo/estilos/_componentes.scss` e
`codigo/aplicacao/comum/componentes/icone/icones.gerado.ts`) não vão para o git:
**para mudar cores, espaços ou ícones, mude o `design-system/`**, nunca esses arquivos.

## Onde está cada coisa

- `codigo/aplicacao/comum/componentes/`: componentes do Design System (importe de `@componentes`).
- `codigo/aplicacao/comum/formularios/`: `validadorZod()` e mensagens de campo (importe de `@formularios`).
- `codigo/aplicacao/comum/estado/`: `<app-estado>`, para carregando, erro e conteúdo.
- `codigo/aplicacao/nucleo/`: serviços únicos (tema, nome do app, título da aba, armazenamento).
- `codigo/aplicacao/telas/`: uma pasta por tela.
- Tipos, validações, datas, telefone e regras vêm do pacote `@limpeza/compartilhado`.
