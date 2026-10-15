# TelaCancelar

Exemplo de tela: como cancelar a presença **sem login**. A pessoa digita o telefone que usou ao confirmar.

**Peças usadas:** Dialog, TextField (`type="tel"`) e Button.

**Como funciona:**

1. Na escala, cada pessoa confirmada tem a opção "Cancelar minha presença".
2. Abre esta janela pedindo o telefone.
3. O back-end só cancela se o telefone bater com o da confirmação.
4. Deu certo: Toast "Presença cancelada." (sem "Desfazer": quem quiser voltar confirma de novo). Telefone errado: mensagem embaixo do campo, "Esse telefone não confere com nenhuma confirmação desta sexta."

**Limite desta solução (decisão consciente):** não é segurança forte. Quem souber o telefone da pessoa consegue cancelar. Serve para evitar cancelamento por engano; se começar a dar problema, o próximo passo é um código por e-mail ou SMS.
