# TelaNovaSexta

Exemplo de tela: o formulário para criar uma sexta. O mesmo formulário serve para editar, com o título "Editar sexta" e os campos já preenchidos.

**Peças usadas:** Form, DateField (data e horários), Stepper (vagas), TaskEditor (tarefas) e Button.

**O que observar:**

1. A ordem segue a pergunta natural: quando → que horas → quantas pessoas → o que fazer.
2. Os horários ficam lado a lado no computador e um embaixo do outro no celular.
3. As tarefas já vêm preenchidas com as da sexta anterior, para não digitar tudo de novo.
4. Editando uma sexta que já tem gente confirmada, ao diminuir as vagas para menos que o número de confirmados, mostre um Alert de erro dizendo quantos já confirmaram e **bloqueie o botão "Salvar sexta"** (o servidor também recusa, regra S8).
5. Na edição, o botão "Apagar sexta" (`btn--danger-ghost`) fica no fim, separado do "Salvar".
