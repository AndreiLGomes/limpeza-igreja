/**
 * Lê e VALIDA as variáveis de ambiente. É o único arquivo que lê process.env.
 * Se faltar algo, o servidor nem sobe, e a mensagem diz qual variável corrigir (sem mostrar valores).
 */
import { z } from 'zod';

/** Formato de um hash bcrypt, ex.: "$2b$12$...". */
const FORMATO_BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/** Variável vazia no .env ("NOME=") conta como não informada. */
const opcional = <T extends z.ZodType>(esquema: T) =>
  z.preprocess((valor) => (valor === '' ? undefined : valor), esquema.optional());

const esquemaAmbiente = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORTA: z.coerce.number().int().min(1).max(65535).default(3000),
    // Quantos intermediários (proxies) ficam na frente do servidor na hospedagem: 1 na Render, 0 no computador.
    // Assim o servidor enxerga o endereço de cada pessoa (limite de tentativas). Nunca "true": daria para falsificar.
    PROXIES_CONFIAVEIS: z.coerce.number().int().min(0).max(5).default(0),
    URL_DO_BANCO: opcional(z.url()),
    URL_DO_BANCO_TESTE: opcional(z.url()),
    // Hash bcrypt, nunca a senha pura (O1). Gere com "npm run gerar-hash-senha".
    SENHA_ORGANIZADOR_HASH: z.string({ error: 'obrigatória (gere com npm run gerar-hash-senha)' }).regex(FORMATO_BCRYPT, {
      error: 'precisa ser um hash bcrypt (gere com npm run gerar-hash-senha), nunca a senha pura',
    }),
    ORIGEM_DO_SITE: z.url(),
  })
  .superRefine((ambiente, ctx) => {
    const variavel = ambiente.NODE_ENV === 'test' ? 'URL_DO_BANCO_TESTE' : 'URL_DO_BANCO';
    if (!ambiente[variavel]) ctx.addIssue({ code: 'custom', path: [variavel], message: 'obrigatória' });
  });

export type Configuracao = z.output<typeof esquemaAmbiente> & {
  /** Banco que o aplicativo usa agora: o de teste quando NODE_ENV=test. */
  urlDoBanco: string;
};

export function lerConfiguracao(ambiente: Record<string, string | undefined> = process.env): Configuracao {
  // A hospedagem (Render) informa a porta em "PORT"; a "PORTA" do .env, quando existe, vale mais.
  const resultado = esquemaAmbiente.safeParse({ ...ambiente, PORTA: ambiente.PORTA || ambiente.PORT });
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((problema) => `- ${problema.path.join('.')}: ${problema.message}`);
    throw new Error(`Variáveis de ambiente inválidas (veja servidor/.env.exemplo):\n${problemas.join('\n')}`);
  }
  const lido = resultado.data;
  const urlDoBanco = (lido.NODE_ENV === 'test' ? lido.URL_DO_BANCO_TESTE : lido.URL_DO_BANCO) ?? '';
  return { ...lido, urlDoBanco };
}

export const configuracao = lerConfiguracao();
