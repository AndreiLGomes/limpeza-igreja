/**
 * "/organizar/limpeza/:id/folha": a folha de presença pronta para imprimir ou salvar em PDF, igual à de papel
 * ("Lista de presença – Entrega de EPI's – Funções da mão de obra"). Sem barra e sem rodapé; A4 deitado.
 * Não mostra telefone (LGPD). As linhas vêm de linhasDaFolha().
 */
import { Component, computed, inject, input, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mesPorExtenso, TEXTO_DO_TIPO_DE_SERVICO, TIPOS_DE_SERVICO, type DiaCompleto } from '@limpeza/compartilhado';
import { Botao } from '@componentes';
import { Carga } from '@nucleo/carga';
import { Limpezas } from '@nucleo/limpezas';
import { Estado } from '../../../comum/estado/estado';
import { linhasDaFolha } from './linhas-da-folha';

@Component({
  selector: 'app-tela-folha',
  imports: [Botao, Estado, RouterLink],
  template: `
    <div class="folha">
      <div class="folha__acoes">
        <a appBotao variante="secundario" [routerLink]="['/organizar/limpeza', id()]">Voltar</a>
        <button appBotao type="button" (click)="imprimir()">Imprimir</button>
      </div>
      <app-estado [estado]="carga.estado()" [erro]="carga.erro()" textoCarregando="Carregando a folha…" (tentar)="carga.carregar()">
        @if (carga.dados(); as dia) {
          <h1 class="subtitle folha__titulo">LISTA DE PRESENÇA – ENTREGA DE EPI's – FUNÇÕES DA MÃO DE OBRA</h1>
          <dl class="small folha__cabecalho">
            <div><dt>Casa de Oração nº (Relatório):</dt><dd>{{ dia.cabecalho.casaDeOracao }}</dd></div>
            <div><dt>Local:</dt><dd>{{ dia.cabecalho.local }}</dd></div>
            <div><dt>Administração/Setor:</dt><dd>{{ dia.cabecalho.setor }}</dd></div>
            <div><dt>Mês:</dt><dd>{{ mes() }}</dd></div>
            <div><dt>Ano:</dt><dd>{{ dia.data.slice(0, 4) }}</dd></div>
            <div><dt>Atividades:</dt><dd>{{ dia.cabecalho.atividades }}</dd></div>
            @for (tipo of tipos; track tipo) {
              <div>
                <dt>{{ textoDoTipo[tipo] }}</dt>
                <dd class="folha__caixa">{{ dia.cabecalho.tipoDeServico === tipo ? 'X' : '' }}</dd>
              </div>
            }
          </dl>
          <div class="folha__rolagem">
            <table class="small folha__tabela">
              <thead>
                <tr>
                  <th rowspan="2">Dia do Mês</th>
                  <th rowspan="2">Código da Função</th>
                  <th rowspan="2">Nº de Adesão</th>
                  <th rowspan="2">Voluntário – Nome</th>
                  <th colspan="2">EPI's Recebeu?</th>
                  <th colspan="2">Horário</th>
                  <th rowspan="2">Assinatura</th>
                </tr>
                <tr>
                  <th>Sim</th>
                  <th>Não</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                </tr>
              </thead>
              <tbody>
                @for (linha of linhas(); track $index) {
                  <tr>
                    <td>{{ linha.dia }}</td>
                    <td>{{ linha.codigo }}</td>
                    <td>{{ linha.adesao }}</td>
                    <td class="folha__nome">{{ linha.nome }}</td>
                    <td>{{ linha.epi === true ? 'X' : '' }}</td>
                    <td>{{ linha.epi === false ? 'X' : '' }}</td>
                    <td>{{ linha.entrada }}</td>
                    <td>{{ linha.saida }}</td>
                    <td>{{ linha.assinatura }}</td>
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

  protected readonly tipos = TIPOS_DE_SERVICO;
  protected readonly textoDoTipo = TEXTO_DO_TIPO_DE_SERVICO;
  /** A mesma Carga da escala e das limpezas: estado, erro e "Tentar de novo". */
  protected readonly carga = new Carga<DiaCompleto | null>(() => this.limpezas.buscar(this.id()), null);
  protected readonly linhas = computed(() => {
    const dia = this.carga.dados();
    return dia ? linhasDaFolha(dia) : [];
  });
  protected readonly mes = computed(() => {
    const dia = this.carga.dados();
    return dia ? mesPorExtenso(dia.data) : '';
  });

  ngOnInit(): void {
    void this.carga.carregar();
  }

  protected imprimir(): void {
    window.print();
  }
}
