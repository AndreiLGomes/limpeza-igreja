import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
import { esperarAte } from '../../../../testes/esperar-ate';
import { EditorDeTarefas, linhaDeTarefa } from './editor-de-tarefas';

@Component({
  imports: [EditorDeTarefas],
  template: `<app-editor-de-tarefas legenda="Tarefas" [lista]="tarefas" />`,
})
class TelaDeTeste {
  tarefas = new FormArray([linhaDeTarefa('Varrer o salão', 'id-salvo')]);
}

async function montar() {
  const montagem = TestBed.createComponent(TelaDeTeste);
  await montagem.whenStable();
  const elemento: HTMLElement = montagem.nativeElement;
  const campos = () => [...elemento.querySelectorAll<HTMLInputElement>('.editlist__row input')];
  const janelaAberta = () => elemento.querySelector('dialog')!.hasAttribute('open');
  const botao = (rotulo: string) =>
    [...elemento.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === rotulo || b.getAttribute('aria-label') === rotulo,
    );
  return {
    tela: montagem.componentInstance,
    campos,
    janelaAberta,
    botao,
    /** Espera a lista mostrar exatamente estes nomes. */
    linhasSerem: (nomes: string[]) =>
      esperarAte(montagem, () => campos().map((c) => c.value).join('|') === nomes.join('|'), `as linhas ${nomes}`),
    esperar: (condicao: () => boolean, descricao?: string) => esperarAte(montagem, condicao, descricao),
  };
}

describe('EditorDeTarefas', () => {
  it('mostra as linhas adicionadas e removidas POR CÓDIGO (armadilha 2 do docs/06)', async () => {
    const { tela, campos, linhasSerem } = await montar();
    expect(campos().map((c) => c.value)).toEqual(['Varrer o salão']);

    tela.tarefas.push(linhaDeTarefa('Tirar o lixo'));
    await linhasSerem(['Varrer o salão', 'Tirar o lixo']);

    tela.tarefas.removeAt(0);
    await linhasSerem(['Tirar o lixo']);
  });

  it('"Adicionar tarefa" cria uma linha vazia e põe o cursor nela', async () => {
    const { tela, campos, botao, esperar } = await montar();
    botao('Adicionar tarefa')!.click();
    await esperar(() => campos().length === 2 && document.activeElement === campos()[1], 'o foco na linha nova');
    expect(tela.tarefas.length).toBe(2);
  });

  it('remover linha nova não pede confirmação', async () => {
    const { tela, botao, esperar, janelaAberta, linhasSerem } = await montar();
    tela.tarefas.push(linhaDeTarefa('Nova'));
    await esperar(() => Boolean(botao('Remover tarefa Nova')), 'o botão da linha nova');

    botao('Remover tarefa Nova')!.click();
    await linhasSerem(['Varrer o salão']);
    expect(janelaAberta()).toBe(false);
  });

  it('remover tarefa já salva pede confirmação; "Manter" não remove, "Remover" remove', async () => {
    const { tela, botao, esperar, janelaAberta, linhasSerem } = await montar();

    botao('Remover tarefa Varrer o salão')!.click();
    await esperar(janelaAberta, 'a janela abrir');
    botao('Manter tarefa')!.click();
    await esperar(() => !janelaAberta(), 'a janela fechar');
    expect(tela.tarefas.length).toBe(1);

    botao('Remover tarefa Varrer o salão')!.click();
    await esperar(janelaAberta, 'a janela abrir de novo');
    botao('Remover tarefa')!.click();
    await linhasSerem([]);
    expect(tela.tarefas.length).toBe(0);
  });
});
