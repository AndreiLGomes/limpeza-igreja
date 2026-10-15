# TelaAcesso

Exemplo de tela: a entrada na área de quem organiza, depois de errar a senha.

**Peças usadas:** AppBar, Form, TextField (`type="password"`), EmptyState (só o ícone) e Button.

**Como funciona o acesso (decisão do projeto):**

1. Quem vem limpar **não faz login**: confirma com nome e telefone.
2. Quem organiza entra aqui com uma **senha de organizador**.
3. Depois de entrar, a barra mostra a etiqueta "Organizador" e as abas mudam (veja TelaOrganizar).

**Regras:**

- A mensagem de erro não diz se a senha "quase" acertou, só que está incorreta.
- Depois de 5 tentativas erradas, espere 1 minuto (isso fica no back-end).
- O link para esta tela fica discreto, no rodapé do app, e não na barra principal.
