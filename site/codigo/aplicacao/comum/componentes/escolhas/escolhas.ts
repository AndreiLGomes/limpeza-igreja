/**
 * <app-escolhas>: opções grandes para escolher uma (radio) ou várias (checkbox), de 2 a 4 (ChoiceGroup).
 *   <app-escolhas legenda="Quanto tempo você pode ficar?" [opcoes]="tempos" emLinha formControlName="tempo" />
 * Com `multipla`, o valor vira uma lista.
 */
import { booleanAttribute, Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CampoDeFormulario, type Opcao } from '../campo-de-formulario';

let proximoGrupo = 0;

@Component({
  selector: 'app-escolhas',
  template: `
    <fieldset class="choices" [class.choices--row]="emLinha()">
      <legend class="choices__legend">{{ legenda() }}</legend>
      @for (opcao of opcoes(); track opcao.valor) {
        <label class="choice">
          <input
            [type]="multipla() ? 'checkbox' : 'radio'"
            [name]="nomeDoGrupo"
            [value]="opcao.valor"
            [checked]="marcada(opcao.valor)"
            [disabled]="desabilitado()"
            (change)="alternar(opcao.valor)"
            (blur)="avisarToque()"
          />
          {{ opcao.rotulo }}
        </label>
      }
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Escolhas), multi: true }],
})
export class Escolhas extends CampoDeFormulario<string | string[]> {
  readonly legenda = input.required<string>();
  readonly opcoes = input.required<Opcao[]>();
  readonly multipla = input(false, { transform: booleanAttribute });
  /** Opções lado a lado. */
  readonly emLinha = input(false, { transform: booleanAttribute });

  protected readonly nomeDoGrupo = `escolha-${++proximoGrupo}`;

  protected marcada(valor: string): boolean {
    const atual = this.valor();
    return Array.isArray(atual) ? atual.includes(valor) : atual === valor;
  }

  protected alternar(valor: string): void {
    if (!this.multipla()) {
      this.mudar(valor);
      return;
    }
    const atual = Array.isArray(this.valor()) ? (this.valor() as string[]) : [];
    this.mudar(atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]);
  }
}

/** Opções de uma pergunta de sim ou não, ex.: "Recebeu EPI?" (L4). */
export const OPCOES_SIM_NAO: Opcao[] = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'nao', rotulo: 'Não' },
];

/** true → "sim", false → "nao", null → null (para o app-escolhas Sim/Não). */
export const paraSimNao = (valor: boolean | null): string | null => (valor === null ? null : valor ? 'sim' : 'nao');

/** "sim" → true, "nao" → false, vazio → null. */
export const deSimNao = (valor: string | null): boolean | null =>
  valor === null || valor === '' ? null : valor === 'sim';
