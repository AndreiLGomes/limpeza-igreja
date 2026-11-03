/**
 * O PDF da folha de presença, montado no próprio aparelho com o jsPDF (texto de verdade, não uma foto da tela).
 * O conteúdo é o mesmo da tela (conteudo-da-folha.ts); aqui fica só o desenho no papel A4 deitado.
 * Medidas em mm e cores preto no branco: exceção do papel registrada no docs/09 (o design-system não tem papel).
 */
import { jsPDF } from 'jspdf';
import autoTable, { type CellDef } from 'jspdf-autotable';
import type { DiaCompleto } from '@limpeza/compartilhado';
import {
  camposDoCabecalho, CELULA_DO_NOME, celulasDaLinha, COLUNAS_DA_FOLHA, linhasDaFolha, nomeDoPdf, quadrinhosDoServico,
  TITULO_DA_FOLHA,
} from './conteudo-da-folha';

const MARGEM = 10;
const PRETO = 0;
const BRANCO = 255;
const ESPACO_ENTRE_CAMPOS = 6;
const ALTURA_DA_LINHA = 6;
const LADO_DO_QUADRINHO = 3.5;

/** Monta o PDF da folha (separado do download para poder ser testado). */
export function montarPdfDaFolha(dia: DiaCompleto): jsPDF {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const largura = pdf.internal.pageSize.getWidth();
  pdf.setTextColor(PRETO);
  pdf.setDrawColor(PRETO);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(TITULO_DA_FOLHA, largura / 2, MARGEM + 4, { align: 'center' });

  // Cabeçalho: "Rótulo: valor" um depois do outro, quebrando a linha quando não cabe (como na tela).
  pdf.setFontSize(9);
  let x = MARGEM;
  let y = MARGEM + 12;
  const reservar = (larguraDoItem: number) => {
    if (x > MARGEM && x + larguraDoItem > largura - MARGEM) {
      x = MARGEM;
      y += ALTURA_DA_LINHA;
    }
  };

  for (const { rotulo, valor } of camposDoCabecalho(dia)) {
    pdf.setFont('helvetica', 'normal');
    const larguraDoRotulo = pdf.getTextWidth(`${rotulo} `);
    pdf.setFont('helvetica', 'bold');
    reservar(larguraDoRotulo + pdf.getTextWidth(valor));
    pdf.setFont('helvetica', 'normal');
    pdf.text(rotulo, x, y);
    pdf.setFont('helvetica', 'bold');
    pdf.text(valor, x + larguraDoRotulo, y);
    x += larguraDoRotulo + pdf.getTextWidth(valor) + ESPACO_ENTRE_CAMPOS;
  }

  pdf.setFont('helvetica', 'normal');
  for (const { rotulo, marcado } of quadrinhosDoServico(dia)) {
    reservar(LADO_DO_QUADRINHO + 1.5 + pdf.getTextWidth(rotulo));
    pdf.rect(x, y - LADO_DO_QUADRINHO + 0.5, LADO_DO_QUADRINHO, LADO_DO_QUADRINHO);
    if (marcado) pdf.text('X', x + LADO_DO_QUADRINHO / 2, y, { align: 'center' });
    pdf.text(rotulo, x + LADO_DO_QUADRINHO + 1.5, y);
    x += LADO_DO_QUADRINHO + 1.5 + pdf.getTextWidth(rotulo) + ESPACO_ENTRE_CAMPOS;
  }

  // A tabela: as colunas com partes (EPI e horário) se dividem na segunda linha do cabeçalho.
  const primeiraLinha: CellDef[] = COLUNAS_DA_FOLHA.map((coluna) =>
    coluna.partes ? { content: coluna.titulo, colSpan: 2 } : { content: coluna.titulo, rowSpan: 2 },
  );
  const segundaLinha = COLUNAS_DA_FOLHA.flatMap((coluna) => coluna.partes ?? []);

  autoTable(pdf, {
    startY: y + ALTURA_DA_LINHA / 2,
    margin: MARGEM,
    theme: 'grid',
    head: [primeiraLinha, segundaLinha],
    body: linhasDaFolha(dia).map(celulasDaLinha),
    // Com muita gente, continua na página seguinte com o cabeçalho das colunas repetido.
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica', fontSize: 8, textColor: PRETO, fillColor: BRANCO, lineColor: PRETO, lineWidth: 0.2,
      halign: 'center', valign: 'middle', cellPadding: 1.5,
    },
    headStyles: { fontStyle: 'bold' },
    columnStyles: { [CELULA_DO_NOME]: { halign: 'left' } },
  });
  return pdf;
}

/** Baixa "folha-de-presenca-AAAA-MM-DD.pdf". */
export function baixarPdfDaFolha(dia: DiaCompleto): void {
  montarPdfDaFolha(dia).save(nomeDoPdf(dia.data));
}
