# TelaSemana

Exemplo de tela inteira: a tela inicial no celular, mostrando a próxima sexta.

**Peças usadas:** AppBar (com Wordmark), Card, StatusBadge, Avatar, Button, Alert e Footer.

**Como ela é montada:**

1. AppBar no topo, com a aba "Esta semana" marcada.
2. Título da tela no estilo `display`.
3. Um Card por sexta, sobre o fundo `surface-alt`.
4. Avisos gerais num Alert neutro, depois dos cards.
5. Footer no fim, com a troca de tema e o link discreto para a área de quem organiza.
6. Margem lateral de 16px (`space-4`) e 24px (`space-6`) entre os blocos.

No projeto Angular, esta tela é `features/semana/semana.ts`.
