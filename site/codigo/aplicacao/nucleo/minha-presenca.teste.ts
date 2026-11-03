import { TestBed } from '@angular/core/testing';
import { MinhaPresenca } from './minha-presenca';

const CELIA = { telefone: '47 91111-2222', numeroAdesao: '08', codigoFuncao: '222' };

function criar(): MinhaPresenca {
  TestBed.resetTestingModule();
  return TestBed.inject(MinhaPresenca);
}

describe('MinhaPresenca (L9)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('lembra telefone, adesão e código, e a entrada da limpeza, na chave "minha-presenca"', () => {
    const servico = criar();
    servico.guardarDados(CELIA);
    servico.guardarEntrada('dia-1', '19:32');
    const deNovo = criar();
    expect(deNovo.dados()).toEqual(CELIA);
    expect(deNovo.entradaEm('dia-1')).toBe('19:32');
    expect(deNovo.entradaEm('dia-2')).toBeNull();
    expect(JSON.parse(localStorage.getItem('minha-presenca')!)).toEqual({ dados: CELIA, entradas: { 'dia-1': '19:32' } });
  });

  it('guarda só a entrada da limpeza atual (as antigas não servem mais)', () => {
    const servico = criar();
    servico.guardarEntrada('dia-1', '19:32');
    servico.guardarEntrada('dia-2', '19:40');
    expect(servico.entradaEm('dia-1')).toBeNull();
    expect(servico.entradaEm('dia-2')).toBe('19:40');
  });

  it('"Não sou eu" esquece tudo', () => {
    const servico = criar();
    servico.guardarDados(CELIA);
    servico.guardarEntrada('dia-1', '19:32');
    servico.esquecer();
    expect(servico.dados()).toBeNull();
    expect(criar().entradaEm('dia-1')).toBeNull();
  });

  it('guardado quebrado ou sem armazenamento: começa vazio e não dá erro', () => {
    localStorage.setItem('minha-presenca', '{quebrado');
    expect(criar().dados()).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cheio');
    });
    expect(() => criar().guardarDados(CELIA)).not.toThrow();
  });
});
