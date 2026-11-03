import type { PessoaCompleta } from '@limpeza/compartilhado';
import {
  camposDoCabecalho, CELULA_DO_NOME, celulasDaLinha, COLUNAS_DA_FOLHA, linhasDaFolha, nomeDoPdf, quadrinhosDoServico,
} from './conteudo-da-folha';

const pessoa = (nome: string, extra: Partial<PessoaCompleta>): PessoaCompleta => ({
  id: nome, nome, tempo: 'todo', telefone: null, observacao: null, criadoEm: '',
  numeroAdesao: null, codigoFuncao: null, recebeuEpi: null, entrada: null, saida: null, assinadoEm: null, ...extra,
});

describe('linhasDaFolha', () => {
  it('só quem veio, em ordem de chegada, e completa até 15 linhas com o dia do mês', () => {
    const linhas = linhasDaFolha({
      data: '2026-03-27',
      pessoas: [
        pessoa('Matheus Bett', { entrada: '19:40', numeroAdesao: '03', codigoFuncao: '222', recebeuEpi: false }),
        pessoa('Não veio', {}),
        pessoa('Célia Gomes', {
          entrada: '19:30', saida: '20:45', numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true,
          assinadoEm: '2026-03-27T22:30:00Z',
        }),
      ],
    });
    expect(linhas).toHaveLength(15);
    expect(linhas[0]).toEqual({
      dia: '27', codigo: '222', adesao: '08', nome: 'Célia Gomes', epi: true, entrada: '19:30', saida: '20:45',
      assinatura: 'Assinado no app em 27/03 às 19:30',
    });
    expect(linhas[1]).toMatchObject({ nome: 'Matheus Bett', epi: false, saida: '', assinatura: '' });
    expect(linhas[2]).toEqual({ dia: '27', codigo: '', adesao: '', nome: '', epi: null, entrada: '', saida: '', assinatura: '' });
  });

  it('com mais gente que o mínimo, não acrescenta linhas em branco', () => {
    const muitas = Array.from({ length: 20 }, (_, i) => pessoa(`P${i}`, { entrada: '19:00' }));
    expect(linhasDaFolha({ data: '2026-03-27', pessoas: muitas })).toHaveLength(20);
  });
});

describe('cabeçalho, células e nome do arquivo (tela e PDF)', () => {
  const dia = {
    data: '2026-11-03',
    cabecalho: { casaDeOracao: '23', local: 'Taiti', setor: null, atividades: 'Limpeza', tipoDeServico: 'apoio' as const },
  };

  it('campos na ordem da folha de papel; vazio fica em branco', () => {
    expect(camposDoCabecalho(dia).map((campo) => `${campo.rotulo} ${campo.valor}`)).toEqual([
      'Casa de Oração nº (Relatório): 23', 'Local: Taiti', 'Administração/Setor: ', 'Mês: novembro', 'Ano: 2026',
      'Atividades: Limpeza',
    ]);
  });

  it('só o tipo escolhido fica marcado', () => {
    expect(quadrinhosDoServico(dia).map((quadrinho) => quadrinho.marcado)).toEqual([true, false, false]);
  });

  it('uma célula por coluna (EPI e horário em duas)', () => {
    const celulas = celulasDaLinha(linhasDaFolha({ data: '2026-11-03', pessoas: [pessoa('Ana', { entrada: '19:00', recebeuEpi: false })] })[0]!);
    expect(celulas).toEqual(['03', '', '', 'Ana', '', 'X', '19:00', '', '']);
    expect(celulas).toHaveLength(COLUNAS_DA_FOLHA.reduce((total, coluna) => total + (coluna.partes ? 2 : 1), 0));
    expect(celulas[CELULA_DO_NOME]).toBe('Ana');
  });

  it('nome do PDF com a data', () => {
    expect(nomeDoPdf('2026-11-03')).toBe('folha-de-presenca-2026-11-03.pdf');
  });
});
