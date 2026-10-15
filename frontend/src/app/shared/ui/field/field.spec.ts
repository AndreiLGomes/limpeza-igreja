import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { esquemaConfirmacao, MENSAGENS } from '@limpeza/shared';
import { validadorZod } from '@forms';
import { esperarAte } from '../../../../testes/esperar-ate';
import { Field } from './field';
import { Input } from './input';

@Component({
  imports: [Field, Input, ReactiveFormsModule],
  template: `
    <app-field label="Telefone" hint="Com DDD" [control]="telefone">
      <input appInput [formControl]="telefone" />
    </app-field>
  `,
})
class TelaDeTeste {
  telefone = new FormControl('', { nonNullable: true, validators: validadorZod(esquemaConfirmacao.shape.telefone) });
}

async function montar() {
  const fixture = TestBed.createComponent(TelaDeTeste);
  await fixture.whenStable();
  const elemento: HTMLElement = fixture.nativeElement;
  const dica = () => elemento.querySelector('.field__hint')?.textContent?.trim();
  return {
    tela: fixture.componentInstance,
    dica,
    comErro: () => elemento.querySelector('.field')!.classList.contains('field--error'),
    campo: () => elemento.querySelector('input')!,
    /** Espera o texto embaixo do campo virar este. */
    dicaSer: (texto: string) => esperarAte(fixture, () => dica() === texto, `a dica "${texto}"`),
  };
}

describe('Field', () => {
  it('liga rótulo, campo e dica (id, for e aria-describedby)', async () => {
    const { campo } = await montar();
    const rotulo = document.querySelector('label.field__label')!;
    expect(rotulo.getAttribute('for')).toBe(campo().id);
    expect(campo().classList).toContain('field__input');
    expect(document.getElementById(campo().getAttribute('aria-describedby')!)?.textContent?.trim()).toBe('Com DDD');
  });

  it('mostra o erro SÓ depois de tocado (sai do campo ou tenta enviar)', async () => {
    const { tela, dica, comErro, campo, dicaSer } = await montar();
    expect(comErro()).toBe(false);
    expect(dica()).toBe('Com DDD');

    tela.telefone.markAsTouched();
    await dicaSer(MENSAGENS.telefoneObrigatorio);
    expect(comErro()).toBe(true);
    expect(campo().getAttribute('aria-invalid')).toBe('true');
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
