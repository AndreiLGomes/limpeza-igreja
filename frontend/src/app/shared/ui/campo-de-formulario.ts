/**
 * Base dos campos ligados a formulários reativos (ControlValueAccessor): Select, ChoiceGroup e
 * Stepper. Guarda as funções que o Angular passa e o estado de desabilitado, num lugar só.
 */
import { signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';

/** Uma opção de Select ou ChoiceGroup. */
export interface Opcao<T = string> {
  value: T;
  label: string;
}

export abstract class CampoDeFormulario<T> implements ControlValueAccessor {
  protected readonly valor = signal<T | null>(null);
  protected readonly desabilitado = signal(false);
  protected avisarMudanca: (valor: T | null) => void = () => {};
  protected avisarToque: () => void = () => {};

  writeValue(valor: T | null): void {
    this.valor.set(valor);
  }

  registerOnChange(fn: (valor: T | null) => void): void {
    this.avisarMudanca = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.avisarToque = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  /** Muda o valor por ação da pessoa: atualiza a tela e avisa o formulário. */
  protected mudar(valor: T | null): void {
    this.valor.set(valor);
    this.avisarMudanca(valor);
  }
}
