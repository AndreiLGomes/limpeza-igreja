/**
 * "/organizar/limpeza/:id/folha": a folha de presença igual à de papel, para imprimir (A4 deitado) ou baixar
 * em PDF ("Gerar PDF"). Sem barra e sem rodapé. Não mostra telefone (LGPD). O conteúdo (título, cabeçalho,
 * colunas e linhas) vem do conteudo-da-folha.ts, o mesmo que o PDF usa.
 */
import { Component, computed, inject, input, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DiaCompleto } from '@limpeza/compartilhado';
import { Botao, ConteudoDoBotao, Notificacoes } from '@componentes';
import { Carga } from '@nucleo/carga';
import { notificarFalha } from '@nucleo/falhas';
import { Limpezas } from '@nucleo/limpezas';
import { Estado } from '../../../comum/estado/estado';
import {
  camposDoCabecalho, CELULA_DO_NOME, celulasDaLinha, COLUNAS_DA_FOLHA, linhasDaFolha, quadrinhosDoServico,
  TITULO_DA_FOLHA,
} from './conteudo-da-folha';

@Component({
  selector: 'app-tela-folha',
  imports: [Botao, ConteudoDoBotao, Estado, RouterLink],
  template: `
    <div class="folha">
      <div class="folha__acoes">
        <a appBotao variante="secundario" [routerLink]="['/organizar/limpeza', id()]">Voltar</a>
        <button appBotao variante="secundario" type="button" [disabled]="!carga.dados()" (click)="imprimir()">Imprimir</button>
        <button appBotao type="button" [esperando]="gerando()" [disabled]="!carga.dados() || gerando()" (click)="gerarPdf()">
          <app-conteudo-do-botao [esperando]="gerando()" textoDeEspera="Gerando…">Gerar PDF</app-conteudo-do-botao>
        </button>
      </div>
      <app-estado [estado]="carga.estado()" [erro]="carga.erro()" textoCarregando="Carregando a folha…" (tentar)="carga.carregar()">
        @if (carga.dados(); as dia) {
          <h1 class="subtitle folha__titulo">{{ titulo }}</h1>
          <dl class="small folha__cabecalho">
            @for (campo of campos(); track campo.rotulo) {
              <div><dt>{{ campo.rotulo }}</dt><dd>{{ campo.valor }}</dd></div>
            }
            @for (quadrinho of quadrinhos(); track quadrinho.rotulo) {
              <div>
                <dt>{{ quadrinho.rotulo }}</dt>
                <dd class="folha__caixa">{{ quadrinho.marcado ? 'X' : '' }}</dd>
              </div>
            }
          </dl>
          <div class="folha__rolagem">
            <table class="small folha__tabela">
              <thead>
                <tr>
                  @for (coluna of colunas; track coluna.titulo) {
                    @if (coluna.partes) {
                      <th colspan="2">{{ coluna.titulo }}</th>
                    } @else {
                      <th rowspan="2">{{ coluna.titulo }}</th>
                    }
                  }
                </tr>
                <tr>
                  @for (coluna of colunas; track coluna.titulo) {
                    @for (parte of coluna.partes ?? []; track parte) {
                      <th>{{ parte }}</th>
                    }
                  }
                </tr>
              </thead>
              <tbody>
                @for (linha of linhas(); track $index) {
                  <tr>
                    @for (celula of celulas(linha); track $index) {
                      <td [class.folha__nome]="$index === celulaDoNome">{{ celula }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </app-estado>
    </div>
  `,
  styles: `
    /* Medidas físicas da folha de papel: exceção registrada no docs/09 (o design-system não tem papel A4). */
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    /* A folha ocupa a tela toda (o .principal é uma coluna flexível). */
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .folha {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
      color: var(--ink);
      background: var(--bg);
    }
    .folha__acoes {
      display: flex;
      gap: var(--space-2);
      justify-content: flex-end;
    }
    .folha__titulo {
      margin: 0;
      text-align: center;
    }
    .folha__cabecalho {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2) var(--space-6);
      margin: 0;
    }
    .folha__cabecalho div {
      display: flex;
      gap: var(--space-1);
    }
    .folha__cabecalho dd {
      margin: 0;
      font-weight: 700;
    }
    /* O quadrinho vem antes do texto, como na folha de papel (no HTML, o dd fica depois do dt). */
    .folha__caixa {
      order: -1;
      min-width: var(--space-4);
      text-align: center;
      border: 1px solid var(--ink);
    }
    /* Na tela estreita, a tabela rola dentro dela mesma, sem rolagem lateral da página. */
    .folha__rolagem {
      overflow-x: auto;
    }
    .folha__tabela {
      width: 100%;
      border-collapse: collapse;
    }
    .folha__tabela th,
    .folha__tabela td {
      border: 1px solid var(--ink);
      padding: var(--space-1) var(--space-2);
      text-align: center;
    }
    .folha__tabela .folha__nome {
      text-align: left;
    }
    /* Com muita gente, a tabela continua na página seguinte com o cabeçalho das colunas repetido. */
    .folha__tabela thead {
      display: table-header-group;
    }
    .folha__tabela tr {
      break-inside: avoid;
    }
    @media print {
      .folha {
        padding: 0;
      }
      .folha__acoes {
        display: none;
      }
      .folha__rolagem {
        overflow: visible;
      }
    }
  `,
})
export class TelaFolha implements OnInit {
  /** ":id" do endereço. */
  readonly id = input.required<string>();

  private readonly limpezas = inject(Limpezas);
  private readonly notificacoes = inject(Notificacoes);

  protected readonly titulo = TITULO_DA_FOLHA;
  protected readonly colunas = COLUNAS_DA_FOLHA;
  protected readonly celulaDoNome = CELULA_DO_NOME;
  protected readonly celulas = celulasDaLinha;
  protected readonly gerando = signal(false);
  /** A mesma Carga da escala e das limpezas: estado, erro e "Tentar de novo". */
  protected readonly carga = new Carga<DiaCompleto | null>(() => this.limpezas.buscar(this.id()), null);
  protected readonly linhas = computed(() => {
    const dia = this.carga.dados();
    return dia ? linhasDaFolha(dia) : [];
  });
  protected readonly campos = computed(() => {
    const dia = this.carga.dados();
    return dia ? camposDoCabecalho(dia) : [];
  });
  protected readonly quadrinhos = computed(() => {
    const dia = this.carga.dados();
    return dia ? quadrinhosDoServico(dia) : [];
  });

  ngOnInit(): void {
    void this.carga.carregar();
  }

  protected imprimir(): void {
    window.print();
  }

  /** Baixa "folha-de-presenca-AAAA-MM-DD.pdf". O jsPDF só é carregado aqui, quando alguém pede o PDF. */
  protected async gerarPdf(): Promise<void> {
    const dia = this.carga.dados();
    if (!dia) return;
    this.gerando.set(true);
    try {
      const { baixarPdfDaFolha } = await import('./pdf-da-folha');
      await baixarPdfDaFolha(dia);
    } catch (erro) {
      notificarFalha(this.notificacoes, erro, () => void this.gerarPdf());
    } finally {
      this.gerando.set(false);
    }
  }
}
