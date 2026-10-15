# TelaConfirmar

Exemplo de tela inteira: o formulário "Confirmar presença" no celular, logo depois de a pessoa tentar enviar com um erro.

**Peças usadas:** AppBar, Form (com Alert), TextField, Select, ChoiceGroup e Button.

**O que observar:**

1. O resumo do erro aparece no topo (Alert) **e** embaixo do campo errado.
2. No celular, os campos lado a lado (`form__row`) ficam um embaixo do outro.
3. O botão principal ocupa a largura toda, e "Cancelar" fica embaixo dele.
4. Nenhuma aba fica marcada na barra, porque esta tela não é uma aba.

No projeto Angular, esta tela é `features/confirmar/confirmar.ts`.
