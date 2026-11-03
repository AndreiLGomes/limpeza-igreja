# Wordmark

O logo do app é só o nome escrito em Verdana negrito, sem símbolo.

## Tamanhos

| Classe | Tamanho | Onde |
| --- | --- | --- |
| `wordmark wordmark--lg` | 40px (32px no celular, podendo quebrar em duas linhas) | Tela de entrada, materiais impressos |
| `wordmark wordmark--md` | 24px | Cabeçalho de página, e-mail |
| `wordmark wordmark--sm` | 18px | Barra superior (AppBar) |

Sobre a barra azul, adicione `wordmark--on-header` (texto branco).

## Regras

- Só duas cores: `ink` sobre fundo claro e `on-header` sobre o azul. Nunca em `primary`, `danger` ou outra cor.
- Não estique, não incline e não troque a fonte.
- Não use o logotipo oficial da Congregação Cristã no Brasil: o app é um projeto pessoal e não deve parecer oficial.
- O nome "Limpeza da Igreja" ainda pode mudar. Trocar o nome só muda o texto.

## Angular

É só texto com a classe, sem componente. Na barra superior (`app-app-bar`), o título já usa o mesmo estilo:

```html
<span class="wordmark wordmark--lg">Limpeza da Igreja</span>

<!-- sobre a barra azul -->
<span class="wordmark wordmark--sm wordmark--on-header">Limpeza da Igreja</span>
```

Para trocar o nome do app no futuro, mude o texto num lugar só: crie uma constante `APP_NAME` e use-a em todos os lugares.
