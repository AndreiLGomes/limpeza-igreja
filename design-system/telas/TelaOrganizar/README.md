# TelaOrganizar

Exemplo de tela: a área de quem organiza, com as próximas sextas e quem confirmou em cada uma (com telefone).

**Peças usadas:** AppBar (com a etiqueta "Organizador"), Button com ícone, IconButton, Card, PersonList e StatusBadge.

**O que observar:**

1. A barra muda: aparece a etiqueta **Organizador**, e as abas viram "Sextas" e "Ver como todos". "Sair" fica no **rodapé** (Footer), no lugar do link "Área de quem organiza".
2. "Nova sexta" é a ação principal da tela, e a única em `primary`.
3. Cada sexta tem um botão de editar (lápis) que leva à TelaNovaSexta preenchida.
4. Os telefones aparecem só aqui, nunca nas telas que todo mundo vê.
5. "Ver como todos" mostra o app como quem vem limpar vê, sem sair da área de organização.
