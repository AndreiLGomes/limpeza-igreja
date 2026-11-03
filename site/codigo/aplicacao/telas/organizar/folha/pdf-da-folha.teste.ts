import { CABECALHO_VAZIO, type DiaCompleto, type PessoaCompleta } from '@limpeza/compartilhado';
import { montarPdfDaFolha } from './pdf-da-folha';

const pessoa = (i: number): PessoaCompleta => ({
  id: `p${i}`, nome: `Pessoa ${i}`, tempo: 'todo', telefone: '47 91111-2222', observacao: null, criadoEm: '',
  numeroAdesao: String(i), codigoFuncao: '222', recebeuEpi: true, entrada: '19:00', saida: null,
  assinadoEm: i === 1 ? '2026-11-03T22:32:00Z' : null,
});

const dia = (pessoas: number): DiaCompleto => ({
  id: 'd1', data: '2026-11-03', inicio: '19:00', fim: '21:00', vagas: 30, tarefas: [],
  pessoas: Array.from({ length: pessoas }, (_, i) => pessoa(i + 1)),
  cabecalho: { ...CABECALHO_VAZIO, local: 'Taiti', tipoDeServico: 'apoio' },
});

/** O texto do PDF (o jsPDF não compacta por padrão, então o texto aparece no arquivo). */
const textoDoPdf = (pessoas: number) => montarPdfDaFolha(dia(pessoas)).output();

describe('montarPdfDaFolha', () => {
  it('tem o título, o cabeçalho, as pessoas e a assinatura do app, sem telefone', () => {
    const texto = textoDoPdf(2);
    for (const trecho of ['LISTA DE PRESEN', 'Taiti', 'novembro', 'Pessoa 1', 'Assinado no app em 03/11 ', 'Assinatura']) {
      expect(texto).toContain(trecho);
    }
    expect(texto).not.toContain('91111');
  });

  it('A4 deitado: uma página com pouca gente e duas com muita', () => {
    expect(textoDoPdf(2)).toMatch(/\/Count 1\b/);
    expect(textoDoPdf(40)).toMatch(/\/Count 2\b/);
    expect(textoDoPdf(2)).toMatch(/\/MediaBox \[0 0 841\.8\d* 595\.2\d*\]/);
  });
});
