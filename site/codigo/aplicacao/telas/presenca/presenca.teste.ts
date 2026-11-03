import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { hoje, mensagemDoErro, type DiaPublico, type Presenca } from '@limpeza/compartilhado';
import { Api, FalhaNaApi } from '@nucleo/api';
import { Escala } from '@nucleo/escala';
import { esperarAte } from '../../../testes/esperar-ate';
import { TelaPresenca } from './presenca';

const DIA: DiaPublico = { id: 'dia-1', data: hoje(), inicio: '19:00', fim: '21:00', vagas: 5, pessoas: [], tarefas: [] };
const CHEGOU: Presenca = { estado: 'chegou', primeiroNome: 'Célia', entrada: '19:32', saida: null, assinadoEm: null };

async function montar(marcarEntrada: () => Promise<Presenca>) {
  const api = { marcarEntrada: vi.fn(marcarEntrada), consultarPresenca: vi.fn() };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: Api, useValue: api },
      {
        provide: Escala,
        useValue: { estado: signal('pronto'), erro: signal(null), carregar: async () => {}, buscar: () => DIA, proximo: () => DIA },
      },
    ],
  });
  const montagem = TestBed.createComponent(TelaPresenca);
  montagem.componentRef.setInput('dia', DIA.id);
  await montagem.whenStable();
  const elemento: HTMLElement = montagem.nativeElement;
  const campo = (rotulo: string) =>
    [...elemento.querySelectorAll('label')].find((label) => label.textContent?.includes(rotulo))?.control as
      | HTMLInputElement
      | undefined;
  const preencher = (rotulo: string, valor: string) => {
    const entrada = campo(rotulo)!;
    entrada.value = valor;
    entrada.dispatchEvent(new Event('input'));
  };
  const botao = (texto: string) =>
    [...elemento.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto)!;
  return { api, elemento, campo, preencher, botao, esperar: (c: () => boolean, d?: string) => esperarAte(montagem, c, d) };
}

describe('TelaPresenca', () => {
  beforeEach(() => localStorage.clear());

  it('"Cheguei" funciona sem o campo Nome (desabilitado) e mostra "Olá, Célia"', async () => {
    const tela = await montar(async () => CHEGOU);
    expect(tela.campo('Seu nome')).toBeUndefined();
    tela.preencher('Telefone', '47 91111-2222');
    tela.preencher('Nº de adesão', '08');
    tela.preencher('Código da função', '222');
    tela.elemento.querySelector<HTMLInputElement>('input[value="sim"]')!.click();
    tela.botao('Cheguei').click();
    // L5: o "Cheguei" só abre a janela; a chegada (e a assinatura) é no "Confirmo".
    await tela.esperar(() => tela.elemento.textContent!.includes('Confirmo que cheguei à limpeza de hoje e que recebi EPI.'), 'a janela');
    expect(tela.api.marcarEntrada).not.toHaveBeenCalled();
    tela.botao('Confirmo').click();

    await tela.esperar(() => tela.elemento.textContent!.includes('Olá, Célia'), 'o estado "chegou"');
    expect(tela.api.marcarEntrada).toHaveBeenCalledWith('dia-1', {
      telefone: '47 91111-2222', numeroAdesao: '08', codigoFuncao: '222', recebeuEpi: true,
    });
  });

  it('quando o servidor pede o nome, o campo aparece com a mensagem', async () => {
    const mensagem = mensagemDoErro('NOME_OBRIGATORIO');
    const tela = await montar(async () => {
      throw new FalhaNaApi({ codigo: 'NOME_OBRIGATORIO', mensagem, campos: { nome: mensagem } });
    });
    tela.preencher('Telefone', '47 92222-3333');
    tela.preencher('Nº de adesão', '03');
    tela.preencher('Código da função', '222');
    tela.elemento.querySelector<HTMLInputElement>('input[value="nao"]')!.click();
    tela.botao('Cheguei').click();
    await tela.esperar(() => tela.elemento.textContent!.includes('não recebi EPI'), 'a janela');
    tela.botao('Confirmo').click();

    await tela.esperar(() => tela.campo('Seu nome') !== undefined, 'o campo Nome aparecer');
    // Armadilha 9 do docs/06: a mensagem embaixo do campo é desenhada um instante depois.
    await tela.esperar(() => (tela.elemento.textContent ?? '').includes(mensagem), 'a mensagem do campo Nome');
  });
});
