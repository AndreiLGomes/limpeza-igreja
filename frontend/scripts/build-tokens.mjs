/**
 * Transforma o Design System (pasta design-system/) em código do front. Roda sozinho antes de
 * "npm start", "npm run build" e "npm test", e também com "npm run tokens" (docs/06-frontend.md).
 *
 * 1. tokens.json      → src/styles/_tokens.scss      (variáveis CSS por tema e classes de texto)
 * 2. components.css   → src/styles/_components.scss  (cópia)
 * 3. icons/*.svg      → src/app/shared/ui/icon/icons.generated.ts (SEM os blocos <metadata>)
 *
 * Os três arquivos gerados ficam fora do git: a fonte única é o design-system/.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pastaDoFront = join(dirname(fileURLToPath(import.meta.url)), '..');
const pastaDoDS = join(pastaDoFront, '..', 'design-system');

const AVISO = 'GERADO por scripts/build-tokens.mjs a partir de design-system/ — não edite à mão.';

function gravar(caminhoRelativo, conteudo) {
  const destino = join(pastaDoFront, caminhoRelativo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, conteudo);
  console.log(`  ✓ ${caminhoRelativo}`);
}

// ---------- 1. tokens.json → _tokens.scss ----------

const tokens = JSON.parse(readFileSync(join(pastaDoDS, 'tokens.json'), 'utf8'));

/** "{mist}" vira var(--mist); qualquer outro valor fica como está. */
const valorCss = (valor) => String(valor).replace(/^\{([\w-]+)\}$/, 'var(--$1)');

/** Tokens que mudam com o tema (cores e sombras). Se faltar o valor de um tema, usa o do primeiro. */
function blocoDoTema(tema, primeiroTema) {
  const linhas = [...tokens.color.tokens, ...tokens.shadow.tokens].map(({ name, value }) => {
    const valor = value[tema] ?? value[primeiroTema];
    return `  --${name}: ${valorCss(valor)};`;
  });
  return linhas.join('\n');
}

const temas = tokens.color.themes.map((tema) => tema.id);
const [primeiroTema, ...outrosTemas] = temas;

const variaveisFixas = [
  ...tokens.spacing.tokens.map(({ name, value }) => `  --${name}: ${value};`),
  ...tokens.radius.tokens.map(({ name, value }) => `  --${name}: ${value};`),
  ...Object.entries(tokens.type.families).map(([chave, valor]) => `  --font-${chave}: ${valor};`),
];

const kebab = (texto) => texto.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);

const classesDeTexto = tokens.type.groups.flatMap((grupo) =>
  grupo.styles.map((estilo) => {
    const { name, sample, usage, ...propriedades } = estilo;
    const linhas = [`  font-family: var(--font-${grupo.family});`];
    for (const [propriedade, valor] of Object.entries(propriedades)) linhas.push(`  ${kebab(propriedade)}: ${valor};`);
    return `/* ${usage} */\n.${name} {\n${linhas.join('\n')}\n}`;
  }),
);

const breakpoints = tokens.breakpoint.tokens.map(({ name, value, usage }) => ` * ${name}: ${value} — ${usage}`);

gravar(
  'src/styles/_tokens.scss',
  [
    `// ${AVISO}`,
    '',
    `:root, [data-theme="${primeiroTema}"] {\n${blocoDoTema(primeiroTema, primeiroTema)}\n}`,
    ...outrosTemas.map((tema) => `[data-theme="${tema}"] {\n${blocoDoTema(tema, primeiroTema)}\n}`),
    `:root {\n${variaveisFixas.join('\n')}\n}`,
    // CSS não aceita var() dentro de @media: os breakpoints viram variáveis do SCSS ($bp-mobile…),
    // que funcionam em @media, e não variáveis CSS.
    `/*\n * Breakpoints:\n${breakpoints.join('\n')}\n */`,
    tokens.breakpoint.tokens.map(({ name, value }) => `$${name}: ${value};`).join('\n'),
    ...classesDeTexto,
    '',
  ].join('\n\n'),
);

// ---------- 2. components.css → _components.scss ----------

gravar(
  'src/styles/_components.scss',
  `// ${AVISO}\n\n${readFileSync(join(pastaDoDS, 'components.css'), 'utf8')}`,
);

// ---------- 3. ícones → icons.generated.ts ----------

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
    return [arquivo.replace(/\.svg$/, ''), conteudo];
  });

gravar(
  'src/app/shared/ui/icon/icons.generated.ts',
  [
    `// ${AVISO}`,
    '// Ícones Lucide (licença ISC, "Lucide Icons and Contributors"): só o miolo de cada <svg>.',
    '',
    'export const ICONES = {',
    ...icones.map(([nome, conteudo]) => `  ${JSON.stringify(nome)}: ${JSON.stringify(conteudo)},`),
    '} as const;',
    '',
    'export type IconName = keyof typeof ICONES;',
    '',
  ].join('\n'),
);
