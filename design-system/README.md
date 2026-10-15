# Limpeza na Sexta

Sistema visual do app que organiza a limpeza da igreja às sextas-feiras: quem vem, quando vem e o que já foi feito. "Limpeza na Sexta" é o nome atual (pode mudar).

## Logo

O logo é o próprio nome, **Limpeza na Sexta**, em Verdana negrito, sem símbolo (veja o componente **Wordmark**). Em fundo claro vai em `ink`; na barra azul, em `on-header`. O logotipo oficial da CCB não é usado.

## De onde vêm as cores

A paleta parte do site oficial da Congregação Cristã no Brasil (congregacaocristanobrasil.org.br), lido em outubro de 2026:

- **navy** `#0c1e3f`: azul-marinho das faixas e do rodapé.
- **petrol** `#033d60`: azul-petróleo dos textos e links.
- **mist** `#d4d9e2`: cinza-azulado do fundo.
- **ink** `#212529`, **muted** `#645f77` e **danger** `#dc3545`: texto, texto secundário e erro.

O tema escuro, a cor **success** e as bordas foram criados para o app. Não fazem parte do site oficial. O app não usa o logotipo nem o nome da CCB como marca: é um projeto pessoal, inspirado nas cores. O rodapé de todas as telas avisa isso (veja Footer).

## Princípios

1. **Sóbrio e limpo.** Fundo claro, muito espaço, poucas cores ao mesmo tempo. Uma tela tem no máximo uma ação em `primary`.
2. **Fácil para todas as idades.** Texto com no mínimo 13px (inclusive iniciais e etiquetas), botões grandes (altura mínima de 44px) e contraste de pelo menos 4.5:1.
3. **Claro antes de bonito.** Datas e nomes sempre por extenso ("Sexta, 16 de outubro"), nunca só ícones.

## Tom de voz

Simples, gentil e direto, em português do Brasil. Fale com a pessoa ("Você confirmou presença"), sem gírias e sem exclamações em excesso.

- Bom: "Confirmar presença", "Ainda faltam 2 pessoas para sexta".
- Evite: "Bora!!", "Erro 500", termos técnicos.

## Cores na prática

| Uso | Token |
| --- | --- |
| Fundo da tela e dos cards | `bg` |
| Fundo de seção / atrás dos cards | `surface-alt` |
| Barra superior e rodapé | `header` com texto `on-header` |
| Botão principal, links, foco | `primary` com texto `on-primary` |
| Texto | `ink`; secundário `muted` (no claro, só sobre `bg`) |
| Bordas de campos | `border` |
| Confirmado / feito | `success` |
| Erro / cancelar | `danger` |

As cores de identidade (`navy`, `petrol`, `mist`) não mudam com o tema. Na interface, use sempre os tokens semânticos (`header`, `primary`, `surface-alt`), que já trocam sozinhos entre claro e escuro.

## Tipografia

Uma família só, **Verdana**, a mesma do site oficial, com DejaVu Sans e Segoe UI como reserva. Ela já vem instalada no Windows e no macOS, então não há arquivo de fonte para baixar. Títulos usam peso 700; texto, peso 400.

## Espaço e cantos

Tudo cai numa grade de 4px (`space-1` a `space-12`). Cantos pouco arredondados: `radius-sm` (4px) em botões e campos, `radius-md` (8px) em cards, `radius-full` só para avatares e bolinhas de status.

## Componentes

Os componentes são **CSS puro**, num arquivo só (`components.css` na pasta do projeto; `components/bundle.css` no Design System online): classes prontas que usam só os tokens. Não dependem de React nem de Angular, então funcionam colando o HTML direto num template.

| Componente | Classe base | Para quê |
| --- | --- | --- |
| AppBar | `.appbar` | Barra superior com nome e abas |
| Footer | `.footer` | Rodapé: tema, entrada de quem organiza, aviso de projeto pessoal |
| Button | `.btn` + `.btn--primary` / `--secondary` / `--danger` / `--ghost` | Ações |
| Form | `.form` + `.alert` | Estrutura de todo formulário: título, aviso, campos e botões |
| TextField | `.field` | Campos de texto com rótulo, dica e erro |
| Select | `.select` (dentro de `.field`) | Lista de opções (5 ou mais) |
| ChoiceGroup | `.choices` + `.choice` | Escolher entre 2 a 4 opções |
| ChecklistItem | `.check` | Tarefa da limpeza que dá para marcar como feita |
| Card | `.card` | Um dia de limpeza (ou outro item) |
| Avatar | `.avatar`, `.avatar-stack` | Quem vem; vagas livres |
| StatusBadge | `.status` + `--ok` / `--pending` / `--missing` | Situação de um dia |
| Wordmark | `.wordmark` | O logo (nome em Verdana negrito) |
| Spinner | `.spinner`, `.loading`, `.skeleton` | Esperando o servidor |
| Toast | `.toast-area` + `.toast` | Mensagem rápida depois de uma ação |
| Dialog | `dialog.dialog` | Confirmar antes de desfazer algo |
| EmptyState | `.empty` | Lista vazia |
| IconButton | `.btn--icon`, `.btn--danger-ghost` | Ações em listas: editar, remover |
| DateField | `.field__input[type=date/time]` | Data e horário com o seletor do celular |
| Stepper | `.stepper` | Número pequeno com − e + (vagas) |
| PersonList | `.list` | Quem confirmou, com telefone (só quem organiza) |
| TaskEditor | `.editlist` | Lista de tarefas editável |

Para usar: gere as variáveis CSS a partir do `tokens.json`, carregue-as e depois o CSS dos componentes, e coloque `data-theme="light"` ou `data-theme="dark"` no `<html>`. Cada componente tem um guia próprio com exemplo em Angular.

## Acesso e área de quem organiza

- **Quem vem limpar não faz login.** Confirma presença com nome e telefone e, para cancelar, digita o mesmo telefone (veja TelaCancelar).
- **Quem organiza** (algumas pessoas) entra com uma **senha de organizador** (TelaAcesso). Lá cria e edita sextas, vagas e tarefas, e vê quem confirmou, com telefone (TelaOrganizar, TelaNovaSexta).
- Na área de quem organiza, a barra superior mostra a etiqueta **Organizador** (`appbar__tag`).
- **Telefones só aparecem na área de quem organiza**, nunca nas telas que todo mundo vê.
- Por enquanto não há lembretes.

## Ícones

26 ícones de traço da biblioteca Lucide (licença livre ISC), no grupo **Icons**. Usam a cor do texto ao lado, 20px dentro de botões e 24px sozinhos. A lista com o uso de cada um está no README do grupo.

## Celular

A maioria das pessoas vai abrir no celular, então ele é o tamanho principal.

- **Até 599px** (`bp-mobile`): as abas da barra superior ficam numa linha que rola de lado; os botões principais de formulários, cards e janelas ocupam a largura toda; o botão de cancelar fica embaixo.
- **Conteúdo** com no máximo 720px de largura (`bp-content`), centralizado, com margem lateral de 16px (`space-4`).
- **Títulos:** o estilo `display` cai de 32px para 26px e o logo grande de 40px para 32px, para caberem sem quebrar palavras.
- **Toque:** tudo que é clicável tem pelo menos 44px de altura.
- Nada pode criar rolagem lateral na página.

## Retorno ao usuário

Toda ação que fala com o servidor mostra o que está acontecendo:

1. **Esperando:** Spinner no botão ("Salvando…") ou na lista ("Carregando a escala…").
2. **Deu certo:** Toast ("Presença confirmada").
3. **Deu errado no formulário:** Alert no topo e mensagem embaixo do campo.
4. **Deu errado na conexão:** Toast de erro com "Tentar de novo".
5. **Ação séria** (cancelar, apagar): Dialog antes.
6. **Nada para mostrar:** EmptyState.
