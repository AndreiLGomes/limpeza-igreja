import { mensagemDoErro, statusDoErro, type CodigoDeErro, type ErroApi } from '@limpeza/compartilhado';

/**
 * Erro de regra de negócio. As rotas e serviços só fazem `throw new ErroDeRegra('SEM_VAGA')`;
 * status e mensagem vêm do catálogo do compartilhado, e tratar-erros.ts monta a resposta.
 */
export class ErroDeRegra extends Error {
  constructor(
    readonly codigo: CodigoDeErro,
    /** Campos extras da resposta, ex.: { campos }, { confirmados } ou { tentarEmSegundos }. */
    readonly extras: Record<string, unknown> = {},
  ) {
    super(codigo);
    this.name = 'ErroDeRegra';
  }

  get status(): number {
    return statusDoErro(this.codigo);
  }

  paraResposta(): ErroApi {
    return { ...this.extras, codigo: this.codigo, mensagem: mensagemDoErro(this.codigo, this.extras) };
  }
}
