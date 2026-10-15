# TelaEstados

Exemplo dos três estados que toda tela com dados do servidor precisa ter: carregando, vazia e com erro de conexão.

**Peças usadas:** AppBar, Spinner (`skeleton`), EmptyState, Alert e Button.

**As regras:**

1. **Carregando:** use linhas cinzas (`skeleton`) no formato do card, e não uma tela branca.
2. **Vazia:** mostre um EmptyState explicando o que vai aparecer ali.
3. **Erro de conexão:** mostre um Alert de erro que não some e um botão "Tentar de novo". Não use EmptyState para erro.

Toda tela nova que busca dados no servidor deve tratar esses três casos.
