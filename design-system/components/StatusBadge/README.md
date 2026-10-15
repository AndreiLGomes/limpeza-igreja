# StatusBadge

Etiqueta curta com uma bolinha colorida que mostra a situação de um dia ou de uma pessoa.

| Classe | Bolinha | Quando usar |
| --- | --- | --- |
| `status status--ok` | `success` | Limpeza feita, presença confirmada |
| `status status--pending` | `primary` | Ainda faltando gente ou tarefa |
| `status status--missing` | `danger` | Ninguém confirmou, prazo perto |
| `status` | `muted` | Neutro / sem informação |

## Regras

- O texto vem sempre junto da cor: a bolinha sozinha não basta para quem não distingue cores.
- O texto fica em `ink` (só a bolinha muda de cor), para manter o contraste alto nos dois temas.

## Angular

Componente `StatusBadge`, importado de `@ui`. O texto vai dentro; `tone` escolhe a cor da bolinha (`ok`, `pending`, `missing` ou, sem nada, neutro).

```html
<app-status-badge tone="ok">Limpeza feita</app-status-badge>
<app-status-badge [tone]="faltam > 0 ? 'pending' : 'ok'">
  {{ faltam > 0 ? 'Faltam ' + faltam : 'Completo' }}
</app-status-badge>
```
