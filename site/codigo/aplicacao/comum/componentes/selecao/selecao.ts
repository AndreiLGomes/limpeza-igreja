/**
 * <app-selecao>: lista de opções (5 ou mais) com o visual do campo de texto (Select do Design System).
 * Vai dentro de um app-campo.
 *   <app-campo rotulo="Qual limpeza?"><app-selecao [opcoes]="limpezas" formControlName="dia" /></app-campo>
 */
import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Entrada } from '../campo/entrada';
import { CampoDeFormulario, type Opcao } from '../campo-de-formulario';

@Component({
  selector: 'app-selecao',
  imports: [Entrada],
  template: `
    <span class="select">
      <select
        appEntrada
        [value]="valor() ?? ''"
        [disabled]="desabilitado()"
        (change)="mudar($any($event.target).value || null)"
        (blur)="avisarToque()"
      >
        @if (textoInicial()) {
          <option value="" disabled [selected]="!valor()">{{ textoInicial() }}</option>
        }
        @for (opcao of opcoes(); track opcao.valor) {
          <option [value]="opcao.valor" [selected]="opcao.valor === valor()">{{ opcao.rotulo }}</option>
        }
      </select>
    </span>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Selecao), multi: true }],
})
export class Selecao extends CampoDeFormulario<string> {
  readonly opcoes = input.required<Opcao[]>();
  /** Texto mostrado enquanto nada foi escolhido, ex.: "Escolha uma limpeza". */
  readonly textoInicial = input<string>();
}
