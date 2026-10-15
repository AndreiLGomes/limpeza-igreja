/**
 * validadorZod(esquema): transforma um esquema Zod do @limpeza/shared num validador do Angular.
 * A mensagem do erro é a MESMA que o servidor mostraria (docs/10): fica em errors.zod.
 * Ex.: nome: ['', validadorZod(esquemaConfirmacao.shape.nome)]
 */
import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import type { z } from 'zod';

export function validadorZod(esquema: z.ZodType): ValidatorFn {
  return (controle: AbstractControl): ValidationErrors | null => {
    const resultado = esquema.safeParse(controle.value);
    if (resultado.success) return null;
    return { zod: resultado.error.issues[0]?.message ?? '' };
  };
}
