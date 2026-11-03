import { describe, expect, it } from 'vitest';
import {
  contadorDeTarefas, podeConfirmar, statusDasTarefas, statusDoDia, vagasLivres,
} from '../codigo/regras.js';

const HOJE = '2026-10-15';

function dia(vagas: number, confirmados: number, data = '2026-10-16') {
  return { data, vagas, pessoas: Array.from({ length: confirmados }, (_, i) => ({ id: String(i) })) };
}

function tarefas(...feitas: boolean[]) {
  return feitas.map((feita) => ({ feita }));
}

describe('vagasLivres', () => {
  it('conta as vagas que sobram, nunca negativo', () => {
    expect(vagasLivres(dia(5, 3))).toBe(2);
    expect(vagasLivres(dia(5, 5))).toBe(0);
    expect(vagasLivres(dia(2, 3))).toBe(0);
  });
});

describe('podeConfirmar (C3)', () => {
  it('pode em limpeza futura com vaga, e também no próprio dia', () => {
    expect(podeConfirmar(dia(5, 3), HOJE)).toBe(true);
    expect(podeConfirmar(dia(5, 3, HOJE), HOJE)).toBe(true);
  });

  it('não pode em limpeza passada', () => {
    expect(podeConfirmar(dia(5, 0, '2026-10-09'), HOJE)).toBe(false);
  });

  it('não pode em limpeza cheia', () => {
    expect(podeConfirmar(dia(5, 5), HOJE)).toBe(false);
  });
});

describe('statusDoDia', () => {
  it('ninguém confirmou', () => {
    expect(statusDoDia(dia(5, 0))).toEqual({ tom: 'faltando', texto: 'Ninguém confirmou' });
  });

  it('faltam pessoas', () => {
    expect(statusDoDia(dia(5, 3))).toEqual({ tom: 'pendente', texto: 'Faltam 2' });
  });

  it('completo', () => {
    expect(statusDoDia(dia(5, 5))).toEqual({ tom: 'ok', texto: 'Completo' });
  });
});

describe('statusDasTarefas (T5)', () => {
  it('nenhuma feita: "A fazer"', () => {
    expect(statusDasTarefas(tarefas(false, false))).toEqual({ tom: 'neutro', texto: 'A fazer' });
  });

  it('parte feita: "Em andamento"', () => {
    expect(statusDasTarefas(tarefas(true, false))).toEqual({ tom: 'pendente', texto: 'Em andamento' });
  });

  it('todas feitas: "Limpeza feita"', () => {
    expect(statusDasTarefas(tarefas(true, true))).toEqual({ tom: 'ok', texto: 'Limpeza feita' });
  });

  it('limpeza sem tarefas: sem etiqueta', () => {
    expect(statusDasTarefas([])).toBeNull();
  });

  it('contador "1 de 4 feitas"', () => {
    expect(contadorDeTarefas(tarefas(true, false, false, false))).toBe('1 de 4 feitas');
  });
});
