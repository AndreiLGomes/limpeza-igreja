import { FormControl } from '@angular/forms';
import { esquemaConfirmacao, esquemaDia, MENSAGENS } from '@limpeza/compartilhado';
import { mensagemDeErro, resumoDeErros } from './mensagens-de-erro';
import { validadorZod } from './validador-zod';

describe('validadorZod()', () => {
  it('aceita o valor válido do esquema do compartilhado', () => {
    const controle = new FormControl('47 99999-1234', validadorZod(esquemaConfirmacao.shape.telefone));
    expect(controle.errors).toBeNull();
  });

  it('devolve a MESMA mensagem do esquema, a que o servidor mostraria', () => {
    const telefone = new FormControl('99999-1234', validadorZod(esquemaConfirmacao.shape.telefone));
    expect(telefone.errors).toEqual({ zod: MENSAGENS.telefoneInvalido });

    const nome = new FormControl('Al', validadorZod(esquemaConfirmacao.shape.nome));
    expect(mensagemDeErro(nome.errors)).toBe(MENSAGENS.nomeCurto);

    const vagas = new FormControl(31, validadorZod(esquemaDia.shape.vagas));
    expect(mensagemDeErro(vagas.errors)).toBe(MENSAGENS.vagasInvalidas);
  });

  it('acompanha a mudança do valor', () => {
    const nome = new FormControl('', validadorZod(esquemaConfirmacao.shape.nome));
    expect(mensagemDeErro(nome.errors)).toBe(MENSAGENS.nomeObrigatorio);
    nome.setValue('Ana Souza');
    expect(nome.errors).toBeNull();
  });
});

describe('mensagens de erro', () => {
  it('a mensagem que veio do servidor tem prioridade', () => {
    expect(mensagemDeErro({ zod: 'do esquema', servidor: 'Esse telefone já está confirmado nesta limpeza.' })).toBe(
      'Esse telefone já está confirmado nesta limpeza.',
    );
    expect(mensagemDeErro(null)).toBeNull();
  });

  it('resumo no topo do formulário', () => {
    expect(resumoDeErros(1)).toBe('Falta 1 informação.');
    expect(resumoDeErros(2)).toBe('Faltam 2 informações.');
  });
});
