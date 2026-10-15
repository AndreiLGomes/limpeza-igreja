/**
 * Comando "npm run seed": dados de exemplo SÓ PARA DESENVOLVIMENTO (docs/03-banco-de-dados.md).
 * Apaga o que houver no banco de desenvolvimento e cria:
 * - 4 sextas a partir da próxima sexta-feira, 19:00–21:00, 5 vagas, com as 4 tarefas de sempre;
 * - na primeira: Andrei Gomes, João Silva e Maria Rocha; na segunda: Paulo Souza.
 * Os telefones são fictícios (4790000000X), nunca números reais.
 */
import { FIM_PADRAO, INICIO_PADRAO, proximaSexta, somarDias, VAGAS_PADRAO, type Tempo } from '@limpeza/shared';
import { gerarToken, hashDeToken, BYTES_DO_CODIGO } from '../comum/seguranca.js';
import { hoje } from '../comum/tempo.js';
import { config } from '../config.js';
import { apagarTudo } from './apagar-tudo.js';
import { db, fecharBanco } from './cliente.js';
import { confirmacoes, dias, tarefas } from './esquema.js';

const QUANTAS_SEXTAS = 4;

const TAREFAS = ['Varrer o salão', 'Limpar os banheiros', 'Passar pano nos bancos', 'Tirar o lixo'];

interface PessoaDeExemplo {
  nome: string;
  telefone: string;
  tempo: Tempo;
  observacao?: string;
}

/** Quem confirmou em cada sexta, pela posição (0 = a primeira). */
const PESSOAS_POR_SEXTA: PessoaDeExemplo[][] = [
  [
    { nome: 'Andrei Gomes', telefone: '47900000001', tempo: 'todo' },
    { nome: 'João Silva', telefone: '47900000002', tempo: 'primeira-hora' },
    { nome: 'Maria Rocha', telefone: '47900000003', tempo: 'todo', observacao: 'vou levar o rodo novo' },
  ],
  [{ nome: 'Paulo Souza', telefone: '47900000004', tempo: 'todo' }],
];

if (config.NODE_ENV === 'production') {
  console.error('O seed é só para desenvolvimento. Nada foi feito.');
  process.exit(1);
}

const primeira = proximaSexta(hoje());
let ordemDeConfirmacao = 0;

await db.transaction(async (tx) => {
  await apagarTudo(tx);

  for (let i = 0; i < QUANTAS_SEXTAS; i++) {
    const [dia] = await tx
      .insert(dias)
      .values({ data: somarDias(primeira, 7 * i), inicio: INICIO_PADRAO, fim: FIM_PADRAO, vagas: VAGAS_PADRAO })
      .returning({ id: dias.id });
    if (!dia) throw new Error('Não foi possível criar a sexta.');

    await tx.insert(tarefas).values(TAREFAS.map((nome, ordem) => ({ diaId: dia.id, nome, ordem })));

    const pessoas = PESSOAS_POR_SEXTA[i] ?? [];
    if (pessoas.length > 0) {
      await tx.insert(confirmacoes).values(
        pessoas.map((pessoa) => ({
          ...pessoa,
          diaId: dia.id,
          codigoCancelamentoHash: hashDeToken(gerarToken(BYTES_DO_CODIGO)),
          // Dentro de uma transação o now() é o mesmo; isto garante a ordem de confirmação.
          criadoEm: new Date(Date.now() + 1000 * ordemDeConfirmacao++),
        })),
      );
    }
  }
});

await fecharBanco();
console.log(`Dados de exemplo criados: ${QUANTAS_SEXTAS} sextas a partir de ${primeira}.`);
