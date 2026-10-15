# Ícones

26 ícones da biblioteca **Lucide** (versão 1.49.0, licença ISC: uso livre, mantendo o aviso de copyright "Lucide Icons and Contributors").

- Traço de 2px, cantos arredondados, desenhados numa grade de 24×24.
- Aqui eles aparecem na cor `ink` (#212529) só para visualização. No app, a cor segue o texto ao lado (`currentColor`).
- No Angular, **não** instale o pacote `lucide-angular` (ele não declara suporte ao Angular 22). Use o componente próprio `<app-icon name="calendar-check" />`, gerado a partir destes arquivos (ver `docs/06-frontend.md`).

| Ícone | Uso no app |
| --- | --- |
| calendar, calendar-check | Sextas da escala; sexta confirmada |
| users, user, user-plus, user-x | Pessoas; confirmar; cancelar presença |
| check, circle-check, list-checks | Tarefa feita; limpeza concluída; lista de tarefas |
| brush | Limpeza (ícone da tela vazia de tarefas) |
| trash-2 | Apagar (só para quem organiza) |
| clock | Horário |
| phone | Telefone |
| bell | Lembretes |
| sun, moon | Tema claro / escuro |
| menu, x | Abrir e fechar menu |
| plus, chevron-down | Adicionar; abrir lista |
| info, triangle-alert | Aviso; erro |
| minus | Diminuir (Stepper) |
| pencil | Editar (área de quem organiza) |
| lock | Área de quem organiza / senha |
| log-out | Sair da área de quem organiza |

Regras: tamanho 20px dentro de botões e 24px sozinho; sempre com texto ao lado ou `aria-label`; nunca mais de um ícone por botão.
