/**
 * Base dos campos ligados a formulários reativos (ControlValueAccessor): Seleção, Escolhas e
 * Contador. Guarda as funções que o Angular passa e o estado de desabilitado, num lugar só.
 * Os nomes writeValue, registerOnChange, registerOnTouched e setDisabledState são exigidos pelo Angular.
 */
import { signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';

/** Uma opção de Seleção ou de Escolhas. */
export interface Opcao<T = string> {
  valor: T;
  rotulo: string;
}

export abstract class CampoDeFormulario<T> implements ControlValueAccessor {
  protected readonly valor = signal<T | null>(null);
  protected readonly desabilitado = signal(false);
  protected avisarMudanca: (valor: T | null) => void = () => {};
  protected avisarToque: () => void = () => {};

  writeValue(valor: T | null): void {
    this.valor.set(valor);
  }

  registerOnChange(funcao: (valor: T | null) => void): void {
    this.avisarMudanca = funcao;
  }

  registerOnTouched(funcao: () => void): void {
    this.avisarToque = funcao;
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
