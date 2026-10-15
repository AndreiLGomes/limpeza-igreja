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
    DATABASE_URL: opcional(z.url()),
    DATABASE_URL_TESTE: opcional(z.url()),
    // Hash bcrypt, nunca a senha pura (O1). Gere com "npm run gerar-hash-senha".
    SENHA_ORGANIZADOR_HASH: z.string({ error: 'obrigatória (gere com npm run gerar-hash-senha)' }).regex(FORMATO_BCRYPT, {
      error: 'precisa ser um hash bcrypt (gere com npm run gerar-hash-senha), nunca a senha pura',
    }),
    ORIGEM_FRONTEND: z.url(),
  })
  .superRefine((ambiente, ctx) => {
    const variavel = ambiente.NODE_ENV === 'test' ? 'DATABASE_URL_TESTE' : 'DATABASE_URL';
    if (!ambiente[variavel]) ctx.addIssue({ code: 'custom', path: [variavel], message: 'obrigatória' });
  });

export type Config = z.output<typeof esquemaAmbiente> & {
  /** Banco que o app usa agora: o de teste quando NODE_ENV=test. */
  urlDoBanco: string;
};

export function lerConfig(ambiente: Record<string, string | undefined> = process.env): Config {
  const resultado = esquemaAmbiente.safeParse(ambiente);
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((problema) => `- ${problema.path.join('.')}: ${problema.message}`);
    throw new Error(`Variáveis de ambiente inválidas (veja backend/.env.exemplo):\n${problemas.join('\n')}`);
  }
  const lido = resultado.data;
  const urlDoBanco = (lido.NODE_ENV === 'test' ? lido.DATABASE_URL_TESTE : lido.DATABASE_URL) ?? '';
  return { ...lido, urlDoBanco };
}

export const config = lerConfig();
