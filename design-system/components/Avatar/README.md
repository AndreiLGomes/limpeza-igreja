# Avatar

Círculo com as iniciais da pessoa; a versão tracejada (`avatar--empty`) mostra uma vaga livre.

## Classes

- `avatar`: 40px. `avatar--sm`: 32px.
- `avatar--empty`: vaga ainda não preenchida, com "+" dentro.
- `avatar-stack`: agrupa vários avatares sobrepostos.

## Regras

- Sempre coloque `aria-label` com o nome completo, porque as iniciais sozinhas não dizem quem é.
- Iniciais: primeira letra do primeiro e do último nome.

## Angular

Componentes `Avatar` e `AvatarStack`, importados de `@ui`. As iniciais e o `aria-label` são calculados sozinhos a partir do nome.

```html
<app-avatar name="Andrei Gomes" />
<app-avatar name="João Silva" size="sm" />
<app-avatar />  <!-- sem nome = vaga livre -->

<!-- completa com vagas livres até o total -->
<app-avatar-stack [names]="dia.confirmados" [total]="dia.vagas" />
```
