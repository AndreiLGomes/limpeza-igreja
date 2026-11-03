/**
 * Comando "npm run seed": dados de exemplo SÓ PARA DESENVOLVIMENTO (docs/03-banco-de-dados.md).
 * Apaga o que houver no banco de desenvolvimento e cria:
 * - 4 quintas a partir da próxima quinta-feira, 19:00–21:00, 5 vagas, com as 4 tarefas de sempre;
 * - na primeira: Andrei Gomes, João Silva e Maria Rocha; na segunda: Paulo Souza.
 * Os dados em si ficam em exemplos.ts (os testes de ponta a ponta usam os mesmos).
 */
import { FIM_PADRAO, hoje, INICIO_PADRAO, somarDias, VAGAS_PADRAO } from '@limpeza/compartilhado';
import { gerarToken, hashDeToken, BYTES_DO_CODIGO } from '../comum/seguranca.js';
import { configuracao } from '../configuracao.js';
import { apagarTudo } from './apagar-tudo.js';
import { bd, fecharBanco } from './cliente.js';
import { confirmacoes, dias, tarefas } from './esquema.js';
import {
  PESSOAS_POR_LIMPEZA, primeiraLimpezaDeExemplo, QUANTAS_LIMPEZAS, TAREFAS_DE_EXEMPLO,
} from './exemplos.js';

if (configuracao.NODE_ENV === 'production') {
  console.error('O seed é só para desenvolvimento. Nada foi feito.');
  process.exit(1);
}

const primeira = primeiraLimpezaDeExemplo(hoje());
let ordemDeConfirmacao = 0;

await bd.transaction(async (tx) => {
  await apagarTudo(tx);

  for (let i = 0; i < QUANTAS_LIMPEZAS; i++) {
    const [dia] = await tx
      .insert(dias)
      .values({ data: somarDias(primeira, 7 * i), inicio: INICIO_PADRAO, fim: FIM_PADRAO, vagas: VAGAS_PADRAO })
      .returning({ id: dias.id });
    if (!dia) throw new Error('Não foi possível criar a limpeza.');

    await tx.insert(tarefas).values(TAREFAS_DE_EXEMPLO.map((nome, ordem) => ({ diaId: dia.id, nome, ordem })));

    const pessoas = PESSOAS_POR_LIMPEZA[i] ?? [];
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
console.log(`Dados de exemplo criados: ${QUANTAS_LIMPEZAS} limpezas (quintas) a partir de ${primeira}.`);
