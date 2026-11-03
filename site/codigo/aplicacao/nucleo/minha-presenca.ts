/**
 * O que este celular lembra da presença (L9): telefone, nº de adesão e código da função, para virem
 * preenchidos, e a hora de entrada da limpeza atual (a janela do "Saí" mostra "a partir das 19:32").
 * Chave "minha-presenca" do localStorage. "Não sou eu" apaga tudo. Todo acesso é seguro (armazenamento.ts).
 */
import { Injectable, signal } from '@angular/core';
import { apagar, gravar, ler } from './armazenamento';

const CHAVE = 'minha-presenca';

export interface DadosGuardados {
  telefone: string;
  numeroAdesao: string;
  codigoFuncao: string;
}

interface Guardado {
  dados: DadosGuardados | null;
  /** diaId → "HH:MM", só da limpeza atual. */
  entradas: Record<string, string>;
}

const VAZIO: Guardado = { dados: null, entradas: {} };

/** Lê o que está guardado; qualquer coisa estranha vira vazio. */
function lerGuardado(): Guardado {
  try {
    const valor = JSON.parse(ler('local', CHAVE) ?? 'null') as Partial<Guardado> | null;
    if (!valor || typeof valor !== 'object') return VAZIO;
    const dados = valor.dados;
    const dadosValidos =
      dados && typeof dados.telefone === 'string' && typeof dados.numeroAdesao === 'string' &&
      typeof dados.codigoFuncao === 'string';
    const entradas = valor.entradas && typeof valor.entradas === 'object' ? valor.entradas : {};
    return { dados: dadosValidos ? dados : null, entradas };
  } catch {
    return VAZIO;
  }
}

@Injectable({ providedIn: 'root' })
export class MinhaPresenca {
  private readonly guardado = signal<Guardado>(lerGuardado());

  private salvar(guardado: Guardado): void {
    this.guardado.set(guardado);
    gravar('local', CHAVE, JSON.stringify(guardado));
  }

  dados(): DadosGuardados | null {
    return this.guardado().dados;
  }

  guardarDados(dados: DadosGuardados): void {
    this.salvar({ ...this.guardado(), dados });
  }

  entradaEm(diaId: string): string | null {
    return this.guardado().entradas[diaId] ?? null;
  }

  guardarEntrada(diaId: string, hora: string): void {
    // Só a da limpeza atual: as de limpezas antigas não servem mais.
    this.salvar({ ...this.guardado(), entradas: { [diaId]: hora } });
  }

  /** "Não sou eu": celular compartilhado ou emprestado. */
  esquecer(): void {
    this.guardado.set(VAZIO);
    apagar('local', CHAVE);
  }
}
