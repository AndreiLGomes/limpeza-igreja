import { mensagemDoErro, statusDoErro, type CodigoDeErro, type ErroApi } from '@limpeza/shared';

/**
 * Erro de regra de negócio. As rotas e serviços só fazem `throw new ErroApp('SEM_VAGA')`;
 * status e mensagem vêm do catálogo do shared, e tratar-erros.ts monta a resposta.
 */
export class ErroApp extends Error {
  constructor(
    readonly codigo: CodigoDeErro,
    /** Campos extras da resposta, ex.: { campos }, { confirmados } ou { tentarEmSegundos }. */
    readonly extras: Record<string, unknown> = {},
  ) {
    super(codigo);
    this.name = 'ErroApp';
  }

  get status(): number {
    return statusDoErro(this.codigo);
  }

  paraResposta(): ErroApi {
    return { ...this.extras, codigo: this.codigo, mensagem: mensagemDoErro(this.codigo, this.extras) };
  }
}
