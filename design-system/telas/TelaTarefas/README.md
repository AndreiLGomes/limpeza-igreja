# TelaTarefas

Exemplo de tela inteira: as tarefas de uma sexta no celular, logo depois de marcar uma como feita.

**Peças usadas:** AppBar, Card, StatusBadge, ChecklistItem e Toast.

**O que observar:**

1. As tarefas ficam dentro do Card, encostadas nas bordas dele.
2. A tarefa feita fica riscada e em cinza. Nesta versão não há responsável por tarefa (regra T6), então não aparece a linha de "quem".
3. O Toast confirma a ação no rodapé e oferece "Desfazer", sem tirar a pessoa da tela.
4. O contador ("1 de 4 feitas") e a etiqueta mudam junto com as marcações.

No projeto Angular, esta tela é `features/tarefas/tarefas.ts`.
