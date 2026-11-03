/**
 * <input appEntrada> / <textarea appEntrada> / <select appEntrada>: o campo dentro de um <app-campo>.
 * Põe a classe do Design System e liga id, aria-describedby e aria-invalid ao app-campo.
 * Em <input type="tel">, formata o telefone enquanto a pessoa digita ("47 99999-9999") e não deixa passar do
 * 11º número (C2). Fica aqui para valer em TODO campo de telefone do app, sem repetir em cada tela.
 */
import { Directive, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatarEnquantoDigita } from '@limpeza/compartilhado';
import { Campo } from './campo';

@Directive({
  selector: 'input[appEntrada], textarea[appEntrada], select[appEntrada]',
  host: {
    class: 'field__input',
    '[id]': 'campo?.idDoCampo',
    '[attr.aria-describedby]': 'campo?.temDica() ? campo?.idDaDica : null',
    '[attr.aria-invalid]': 'campo?.erro() ? "true" : null',
    '(input)': 'formatarTelefone()',
  },
})
export class Entrada {
  protected readonly campo = inject(Campo, { optional: true });
  private readonly elemento = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly controle = inject(NgControl, { optional: true, self: true });

  /** C2: no telefone, o campo e o formulário ficam sempre com o número já formatado. */
  protected formatarTelefone(): void {
    const campo = this.elemento.nativeElement;
    if (campo.type !== 'tel') return;
    const formatado = formatarEnquantoDigita(campo.value);
    if (formatado === campo.value) return;
    campo.value = formatado;
    this.controle?.control?.setValue(formatado);
  }
}
