import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ESPERA_PARA_AVISAR_MS, Estado, type EstadoDaCarga } from './estado';

@Component({
  imports: [Estado],
  template: `<app-estado [estado]="estado()">pronto</app-estado>`,
})
class TelaDeTeste {
  readonly estado = signal<EstadoDaCarga>('carregando');
}

const AVISO = 'O servidor está iniciando.';

async function montar() {
  const montagem = TestBed.createComponent(TelaDeTeste);
  // Sem whenStable: com o relógio falso ele esperaria para sempre. A detecção direta já roda o effect.
  montagem.detectChanges();
  const texto = () => (montagem.nativeElement as HTMLElement).textContent ?? '';
  return { montagem, texto };
}

describe('Estado', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
  afterEach(() => vi.useRealTimers());

  it('carregando: só as linhas cinzas no começo; o aviso do servidor iniciando aparece se demorar', async () => {
    const { montagem, texto } = await montar();
    expect(texto()).not.toContain(AVISO);

    await vi.advanceTimersByTimeAsync(ESPERA_PARA_AVISAR_MS - 100);
    montagem.detectChanges();
    expect(texto()).not.toContain(AVISO);

    await vi.advanceTimersByTimeAsync(200);
    montagem.detectChanges();
    expect(texto()).toContain(AVISO);
    expect(texto()).toContain('até 1 minuto');
  });

  it('o aviso some quando os dados chegam e recomeça a contar numa carga nova', async () => {
    const { montagem, texto } = await montar();
    await vi.advanceTimersByTimeAsync(ESPERA_PARA_AVISAR_MS + 100);
    montagem.detectChanges();
    expect(texto()).toContain(AVISO);

    montagem.componentInstance.estado.set('pronto');
    montagem.detectChanges();
    expect(texto()).not.toContain(AVISO);
    expect(texto()).toContain('pronto');

    montagem.componentInstance.estado.set('carregando');
    montagem.detectChanges();
    expect(texto()).not.toContain(AVISO);
  });
});
