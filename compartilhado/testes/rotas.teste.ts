import { describe, expect, it } from 'vitest';
import { ROTAS } from '../codigo/rotas.js';

describe('rotas (docs/04-api.md)', () => {
  it('montam os endereços com o id', () => {
    expect(ROTAS.confirmar('abc')).toBe('/dias/abc/confirmacoes');
    expect(ROTAS.tarefa('d1', 't1')).toBe('/dias/d1/tarefas/t1');
    expect(ROTAS.organizador.pessoa('d1', 'p1')).toBe('/organizador/dias/d1/pessoas/p1');
    expect(ROTAS.presenca.entrada('d1')).toBe('/dias/d1/presenca/entrada');
    expect(ROTAS.organizador.presenca('d1', 'p1')).toBe('/organizador/dias/d1/pessoas/p1/presenca');
    expect(ROTAS.organizador.encerrar('d1')).toBe('/organizador/dias/d1/encerrar');
    expect(ROTAS.organizador.presencaNova('d1')).toBe('/organizador/dias/d1/presenca');
  });

  it('servem para o Express quando recebem o nome do parâmetro', () => {
    expect(ROTAS.cancelarPorTelefone(':id')).toBe('/dias/:id/confirmacoes/cancelar-por-telefone');
  });
});
