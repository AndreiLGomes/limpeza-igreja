/**
 * <app-campo>: monta rótulo, dica e erro de um campo (TextField, Select, DateField, Stepper).
 * O campo vai dentro, com a diretiva appEntrada (ou um componente que a use), que recebe o id e o
 * aria-describedby daqui. O erro só aparece depois que a pessoa sai do campo ou tenta enviar.
 *
 *   <app-campo rotulo="Seu nome" obrigatorio [controle]="formulario.controls.nome">
 *     <input appEntrada formControlName="nome" />
 *   </app-campo>
 */
import { booleanAttribute, Component, computed, input } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { mensagemDeErro } from '@formularios';
import { estadoDoControle } from './estado-do-controle';

let proximoId = 0;

@Component({
  selector: 'app-campo',
  template: `
    <div class="field" [class.field--error]="erro()">
      <label class="field__label" [for]="idDoCampo">
        {{ rotulo() }}
        @if (obrigatorio()) {
          <span class="form__required" aria-hidden="true">*</span>
        }
      </label>
      <ng-content />
      @if (erro(); as mensagem) {
        <span class="field__hint" [id]="idDaDica">{{ mensagem }}</span>
      } @else if (dica()) {
        <span class="field__hint" [id]="idDaDica">{{ dica() }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `,
})
export class Campo {
  readonly rotulo = input.required<string>();
  readonly dica = input<string>();
  readonly obrigatorio = input(false, { transform: booleanAttribute });
  /** O controle do formulário, para mostrar o erro dele. */
  readonly controle = input<AbstractControl | null>();

  readonly idDoCampo = `campo-${++proximoId}`;
  readonly idDaDica = `${this.idDoCampo}-dica`;

  private readonly estado = estadoDoControle(
    this.controle,
    (controle) => ({ tocado: controle.touched, erros: controle.errors }),
    { tocado: false, erros: null },
  );

  /** A mensagem de erro, só depois de tocado. */
  readonly erro = computed(() => (this.estado().tocado ? mensagemDeErro(this.estado().erros) : null));

  /** Se há texto embaixo do campo (dica ou erro), para o aria-describedby. */
  readonly temDica = computed(() => Boolean(this.erro() || this.dica()));
}
