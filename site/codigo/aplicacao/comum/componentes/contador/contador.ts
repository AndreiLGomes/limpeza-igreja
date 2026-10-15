/**
 * <app-contador>: número pequeno com − e + (ex.: vagas, de 1 a 30), o Stepper do Design System.
 * Dá para digitar no meio. No limite, o botão correspondente fica desabilitado. Vai dentro de um app-campo.
 *   <app-campo rotulo="Vagas"><app-contador formControlName="vagas" [minimo]="1" [maximo]="30" unidade="vagas" /></app-campo>
 */
import { Component, forwardRef, inject, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Botao } from '../botao/botao';
import { Campo } from '../campo/campo';
import { Icone } from '../icone/icone';
import { CampoDeFormulario } from '../campo-de-formulario';

@Component({
  selector: 'app-contador',
  imports: [Botao, Icone],
  template: `
    <div class="stepper">
      <button
        appBotao
        variante="discreto"
        icone
        type="button"
        [attr.aria-label]="'Diminuir ' + unidade()"
        [disabled]="desabilitado() || (valor() ?? minimo()) <= minimo()"
        (click)="somar(-1)"
      >
        <app-icone nome="minus" />
      </button>
      <input
        class="stepper__value"
        type="number"
        inputmode="numeric"
        [id]="campo?.idDoCampo"
        [attr.aria-describedby]="campo?.temDica() ? campo.idDaDica : null"
        [attr.aria-invalid]="campo?.erro() ? 'true' : null"
        [min]="minimo()"
        [max]="maximo()"
        [value]="valor() ?? ''"
        [disabled]="desabilitado()"
        (input)="digitar($any($event.target).value)"
        (blur)="avisarToque()"
      />
      <button
        appBotao
        variante="discreto"
        icone
        type="button"
        [attr.aria-label]="'Aumentar ' + unidade()"
        [disabled]="desabilitado() || (valor() ?? maximo()) >= maximo()"
        (click)="somar(1)"
      >
        <app-icone nome="plus" />
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Contador), multi: true }],
})
export class Contador extends CampoDeFormulario<number> {
  readonly minimo = input(0);
  readonly maximo = input(Number.MAX_SAFE_INTEGER);
  /** Para os botões, no plural: "Diminuir vagas" / "Aumentar vagas". */
  readonly unidade = input.required<string>();

  protected readonly campo = inject(Campo, { optional: true });

  protected somar(quanto: number): void {
    const atual = this.valor() ?? this.minimo();
    this.mudar(Math.min(this.maximo(), Math.max(this.minimo(), atual + quanto)));
    this.avisarToque();
  }

  protected digitar(texto: string): void {
    // Campo vazio vira null, para a validação dizer que falta o número.
    this.mudar(texto === '' ? null : Number(texto));
  }
}
