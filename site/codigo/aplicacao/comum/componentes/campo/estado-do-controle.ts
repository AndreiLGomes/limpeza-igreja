/**
 * Armadilha 2 do docs/06: sem zone.js, mudanças num controle de formulário (tocado, erro, valor,
 * linhas de um FormArray) não redesenham a tela sozinhas, porque não são signals.
 * estadoDoControle() escuta `control.events` num effect e devolve um signal que acompanha o controle.
 */
import { effect, signal, type Signal } from '@angular/core';
import type { AbstractControl } from '@angular/forms';

/**
 * @param controle signal com o controle (pode mudar ou ser undefined)
 * @param ler      o que extrair do controle a cada mudança
 */
export function estadoDoControle<C extends AbstractControl, T>(
  controle: () => C | undefined | null,
  ler: (controle: C) => T,
  inicial: T,
): Signal<T> {
  const estado = signal<T>(inicial);
  effect((onCleanup) => {
    const atual = controle();
    if (!atual) {
      estado.set(inicial);
      return;
    }
    estado.set(ler(atual));
    const inscricao = atual.events.subscribe(() => estado.set(ler(atual)));
    onCleanup(() => inscricao.unsubscribe());
  });
  return estado.asReadonly();
}
