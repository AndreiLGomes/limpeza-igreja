import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { esquemaConfirmacao, MENSAGENS } from '@limpeza/compartilhado';
import { validadorZod } from '@formularios';
import { esperarAte } from '../../../../testes/esperar-ate';
import { Campo } from './campo';
import { Entrada } from './entrada';

@Component({
  imports: [Campo, Entrada, ReactiveFormsModule],
  template: `
    <app-campo rotulo="Telefone" dica="Com DDD" [controle]="telefone">
      <input appEntrada [formControl]="telefone" />
    </app-campo>
  `,
})
class TelaDeTeste {
  telefone = new FormControl('', { nonNullable: true, validators: validadorZod(esquemaConfirmacao.shape.telefone) });
}

async function montar() {
  const montagem = TestBed.createComponent(TelaDeTeste);
  await montagem.whenStable();
  const elemento: HTMLElement = montagem.nativeElement;
  const dica = () => elemento.querySelector('.field__hint')?.textContent?.trim();
  return {
    tela: montagem.componentInstance,
    dica,
    comErro: () => elemento.querySelector('.field')!.classList.contains('field--error'),
    entrada: () => elemento.querySelector('input')!,
    /** Espera o texto embaixo do campo virar este. */
    dicaSer: (texto: string) => esperarAte(montagem, () => dica() === texto, `a dica "${texto}"`),
  };
}

describe('Campo', () => {
  it('liga rótulo, campo e dica (id, for e aria-describedby)', async () => {
    const { entrada } = await montar();
    const rotulo = document.querySelector('label.field__label')!;
    expect(rotulo.getAttribute('for')).toBe(entrada().id);
    expect(entrada().classList).toContain('field__input');
    expect(document.getElementById(entrada().getAttribute('aria-describedby')!)?.textContent?.trim()).toBe('Com DDD');
  });

  it('mostra o erro SÓ depois de tocado (sai do campo ou tenta enviar)', async () => {
    const { tela, dica, comErro, entrada, dicaSer } = await montar();
    expect(comErro()).toBe(false);
    expect(dica()).toBe('Com DDD');

    tela.telefone.markAsTouched();
    await dicaSer(MENSAGENS.telefoneObrigatorio);
    expect(comErro()).toBe(true);
    expect(entrada().getAttribute('aria-invalid')).toBe('true');
  });

  it('muda quando o controle muda (sem zone.js, armadilha 2)', async () => {
    const { tela, comErro, dicaSer } = await montar();
    tela.telefone.markAsTouched();
    tela.telefone.setValue('123');
    await dicaSer(MENSAGENS.telefoneInvalido);

    tela.telefone.setValue('47 99999-1234');
    await dicaSer('Com DDD');
    expect(comErro()).toBe(false);

    tela.telefone.setErrors({ servidor: 'Esse telefone já está confirmado nesta sexta.' });
    await dicaSer('Esse telefone já está confirmado nesta sexta.');
  });
});
