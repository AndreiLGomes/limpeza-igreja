/**
 * Erros que vêm do servidor num formulário: cada um vai embaixo do seu campo (chave `servidor`,
 * que o app-campo mostra), e os que não têm campo no formulário voltam para ir no aviso do topo.
 */
import type { FormGroup } from '@angular/forms';

/** O aviso no topo do formulário (Alert de erro do Design System). */
export interface AvisoDoFormulario {
  titulo: string;
  texto?: string;
}

/** Põe cada mensagem no campo de mesmo nome; devolve as que não acharam campo. */
export function mostrarErrosNosCampos(formulario: FormGroup, campos: Record<string, string>): string[] {
  const semCampo: string[] = [];
  for (const [campo, mensagem] of Object.entries(campos)) {
    const controle = formulario.get(campo);
    if (controle) {
      controle.setErrors({ servidor: mensagem });
      // O app-campo só mostra erro de campo tocado; erro do servidor tem que aparecer sempre.
      controle.markAsTouched();
    }
    else semCampo.push(mensagem);
  }
  return semCampo;
}
