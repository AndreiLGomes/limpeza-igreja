import { TestBed } from '@angular/core/testing';
import { MinhasConfirmacoes } from './minhas-confirmacoes';

const PEDRO = { diaId: 'dia-1', pessoaId: 'pessoa-1', codigo: 'codigo-1' };
const ANA = { diaId: 'dia-2', pessoaId: 'pessoa-2', codigo: 'codigo-2' };

/** Uma sexta com estas pessoas (só o que o serviço olha). */
const sexta = (id: string, ...pessoas: string[]) => ({ id, pessoas: pessoas.map((p) => ({ id: p, nome: p, tempo: 'todo' as const })) });

function criar(): MinhasConfirmacoes {
  TestBed.resetTestingModule();
  return TestBed.inject(MinhasConfirmacoes);
}

describe('MinhasConfirmacoes', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('grava e lê de novo, na chave "confirmacoes" (C7)', () => {
    criar().guardar(PEDRO);
    expect(JSON.parse(localStorage.getItem('confirmacoes')!)).toEqual([PEDRO]);
    expect(criar().daSexta('dia-1')).toEqual(PEDRO);
  });

  it('uma confirmação por sexta: confirmar de novo substitui', () => {
    const servico = criar();
    servico.guardar(PEDRO);
    servico.guardar({ ...PEDRO, pessoaId: 'pessoa-9', codigo: 'novo' });
    expect(servico.lista()).toEqual([{ ...PEDRO, pessoaId: 'pessoa-9', codigo: 'novo' }]);
  });

  it('confirmouEm (X1): só se a pessoa ainda está na sexta', () => {
    const servico = criar();
    servico.guardar(PEDRO);
    expect(servico.confirmouEm(sexta('dia-1', 'pessoa-1'))).toBe(true);
    expect(servico.confirmouEm(sexta('dia-1', 'outra'))).toBe(false);
    expect(servico.confirmouEm(sexta('dia-2', 'pessoa-1'))).toBe(false);
  });

  it('esquecer (X5) apaga só daquela sexta', () => {
    const servico = criar();
    servico.guardar(PEDRO);
    servico.guardar(ANA);
    servico.esquecer('dia-1');
    expect(servico.lista()).toEqual([ANA]);
  });

  it('limparSumidas (X6): apaga quem sumiu da sexta e não mexe em sextas que não vieram', () => {
    const servico = criar();
    servico.guardar(PEDRO);
    servico.guardar(ANA);
    servico.limparSumidas([sexta('dia-1', 'outra-pessoa')]);
    expect(servico.lista()).toEqual([ANA]);
  });

  it('ignora conteúdo estranho guardado (texto quebrado ou formato errado)', () => {
    localStorage.setItem('confirmacoes', '{ quebrado');
    expect(criar().lista()).toEqual([]);
    localStorage.setItem('confirmacoes', JSON.stringify([PEDRO, { diaId: 1 }, 'x']));
    expect(criar().lista()).toEqual([PEDRO]);
  });

  it('funciona mesmo se o localStorage der erro (aba anônima, cota cheia)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const servico = criar();
    expect(servico.lista()).toEqual([]);
    expect(() => servico.guardar(PEDRO)).not.toThrow();
    expect(servico.daSexta('dia-1')).toEqual(PEDRO);
  });
});
