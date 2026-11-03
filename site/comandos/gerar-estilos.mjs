/**
 * Transforma o Design System (pasta design-system/) em código do site. Roda sozinho antes de
 * "npm start", "npm run build" e "npm test", e também com "npm run gerar-estilos" (docs/06-frontend.md).
 *
 * 1. tokens.json      → codigo/estilos/_variaveis.scss   (variáveis CSS por tema e classes de texto)
 * 2. components.css   → codigo/estilos/_componentes.scss (cópia)
 * 3. icons/*.svg      → codigo/aplicacao/comum/componentes/icone/icones.gerado.ts (SEM os blocos <metadata>)
 *
 * Os três arquivos gerados ficam fora do git: a fonte única é o design-system/.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pastaDoSite = join(dirname(fileURLToPath(import.meta.url)), '..');
const pastaDoDS = join(pastaDoSite, '..', 'design-system');

const AVISO = 'GERADO por comandos/gerar-estilos.mjs a partir de design-system/ — não edite à mão.';

function gravar(caminhoRelativo, conteudo) {
  const destino = join(pastaDoSite, caminhoRelativo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, conteudo);
  console.log(`  ✓ ${caminhoRelativo}`);
}

// ---------- 1. tokens.json → _variaveis.scss ----------

const definicoes = JSON.parse(readFileSync(join(pastaDoDS, 'tokens.json'), 'utf8'));

/** "{mist}" vira var(--mist); qualquer outro valor fica como está. */
const valorCss = (valor) => String(valor).replace(/^\{([\w-]+)\}$/, 'var(--$1)');

/** Variáveis que mudam com o tema (cores e sombras). Se faltar o valor de um tema, usa o do primeiro. */
function blocoDoTema(tema, primeiroTema) {
  const linhas = [...definicoes.color.tokens, ...definicoes.shadow.tokens].map(({ name, value }) => {
    const valor = value[tema] ?? value[primeiroTema];
    return `  --${name}: ${valorCss(valor)};`;
  });
  return linhas.join('\n');
}

const temas = definicoes.color.themes.map((tema) => tema.id);
const [primeiroTema, ...outrosTemas] = temas;

const variaveisFixas = [
  ...definicoes.spacing.tokens.map(({ name, value }) => `  --${name}: ${value};`),
  ...definicoes.radius.tokens.map(({ name, value }) => `  --${name}: ${value};`),
  ...Object.entries(definicoes.type.families).map(([chave, valor]) => `  --font-${chave}: ${valor};`),
];

/** "letterSpacing" → "letter-spacing". */
const comHifens = (texto) => texto.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);

const classesDeTexto = definicoes.type.groups.flatMap((grupo) =>
  grupo.styles.map((estilo) => {
    const { name: nome, sample: _exemplo, usage: uso, ...propriedades } = estilo;
    const linhas = [`  font-family: var(--font-${grupo.family});`];
    for (const [propriedade, valor] of Object.entries(propriedades)) linhas.push(`  ${comHifens(propriedade)}: ${valor};`);
    return `/* ${uso} */\n.${nome} {\n${linhas.join('\n')}\n}`;
  }),
);

const pontosDeQuebra = definicoes.breakpoint.tokens.map(({ name, value, usage }) => ` * ${name}: ${value} — ${usage}`);

gravar(
  'codigo/estilos/_variaveis.scss',
  [
    `// ${AVISO}`,
    `:root, [data-theme="${primeiroTema}"] {\n${blocoDoTema(primeiroTema, primeiroTema)}\n}`,
    ...outrosTemas.map((tema) => `[data-theme="${tema}"] {\n${blocoDoTema(tema, primeiroTema)}\n}`),
    // Na impressão, a folha sai sempre no tema claro. Os seletores são os mesmos dos temas (inclusive o escuro):
    // por vir depois no arquivo, este bloco ganha no empate de especificidade.
    `@media print {\n  ${[':root', ...temas.map((tema) => `[data-theme="${tema}"]`)].join(', ')} {\n${blocoDoTema(primeiroTema, primeiroTema).replaceAll('\n', '\n  ').replace(/^/, '  ')}\n  }\n}`,
    `:root {\n${variaveisFixas.join('\n')}\n}`,
    // CSS não aceita var() dentro de @media: os pontos de quebra viram variáveis do SCSS ($bp-mobile…),
    // que funcionam em @media, e não variáveis CSS. Os nomes vêm do Design System.
    `/*\n * Pontos de quebra (breakpoints):\n${pontosDeQuebra.join('\n')}\n */`,
    definicoes.breakpoint.tokens.map(({ name, value }) => `$${name}: ${value};`).join('\n'),
    ...classesDeTexto,
    '',
  ].join('\n\n'),
);

// ---------- 2. components.css → _componentes.scss ----------

gravar(
  'codigo/estilos/_componentes.scss',
  `// ${AVISO}\n\n${readFileSync(join(pastaDoDS, 'components.css'), 'utf8')}`,
);

// ---------- 3. ícones → icones.gerado.ts ----------

const pastaDosIcones = join(pastaDoDS, 'icons');
const icones = readdirSync(pastaDosIcones)
  .filter((arquivo) => arquivo.endsWith('.svg'))
  .sort()
  .map((arquivo) => {
    const svg = readFileSync(join(pastaDosIcones, arquivo), 'utf8')
      // Armadilha 4 do docs/06: o bloco <metadata> tem ~8 KB e não serve para nada no app.
      .replace(/<metadata[\s\S]*?<\/metadata>/g, '');
    const miolo = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
    if (!miolo) throw new Error(`Ícone sem <svg>: ${arquivo}`);
    const conteudo = miolo.replace(/\s*\n\s*/g, '').trim();
    // O nome do ícone é o nome do arquivo no Design System (ex.: "calendar-check").
    return [arquivo.replace(/\.svg$/, ''), conteudo];
  });

gravar(
  'codigo/aplicacao/comum/componentes/icone/icones.gerado.ts',
  [
    `// ${AVISO}`,
    '// Ícones Lucide (licença ISC, "Lucide Icons and Contributors"): só o miolo de cada <svg>.',
    '',
    'export const ICONES = {',
    ...icones.map(([nome, conteudo]) => `  ${JSON.stringify(nome)}: ${JSON.stringify(conteudo)},`),
    '} as const;',
    '',
    'export type NomeDoIcone = keyof typeof ICONES;',
    '',
  ].join('\n'),
);
