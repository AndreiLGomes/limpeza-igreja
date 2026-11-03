import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { esperarAte } from '../../../../testes/esperar-ate';
import { Entrada } from './entrada';

@Component({
  imports: [Entrada, ReactiveFormsModule],
  template: `
    <input appEntrada type="tel" [formControl]="telefone" />
    <input appEntrada type="text" [formControl]="nome" />
  `,
})
class TelaDeTeste {
  telefone = new FormControl('', { nonNullable: true });
  nome = new FormControl('', { nonNullable: true });
}

async function montar() {
  const montagem = TestBed.createComponent(TelaDeTeste);
  await montagem.whenStable();
  const [telefone, nome] = [...(montagem.nativeElement as HTMLElement).querySelectorAll('input')];
  const digitar = (campo: HTMLInputElement, texto: string) => {
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
  };
  return { tela: montagem.componentInstance, telefone: telefone!, nome: nome!, digitar, montagem };
}

describe('appEntrada: telefone (C2)', () => {
  it('formata enquanto a pessoa digita, no campo e no formulário', async () => {
    const { tela, telefone, digitar, montagem } = await montar();
    digitar(telefone, '479999');
    await esperarAte(montagem, () => telefone.value === '47 9999', 'o formato parcial');
    expect(tela.telefone.value).toBe('47 9999');

    digitar(telefone, '47999991234');
    await esperarAte(montagem, () => telefone.value === '47 99999-1234', 'o celular formatado');
    expect(tela.telefone.value).toBe('47 99999-1234');
  });

  it('não deixa passar do 11º número', async () => {
    const { tela, telefone, digitar, montagem } = await montar();
    digitar(telefone, '4799999123456789');
    await esperarAte(montagem, () => telefone.value === '47 99999-1234', 'o corte no 11º número');
    expect(tela.telefone.value).toBe('47 99999-1234');
  });

  it('campo que não é telefone fica como a pessoa digitou', async () => {
    const { tela, nome, digitar } = await montar();
    digitar(nome, '479999 Célia');
    expect(tela.nome.value).toBe('479999 Célia');
  });
});
