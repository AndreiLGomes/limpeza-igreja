/**
 * Armadilha 9 do docs/06: sem zone.js, a tela atualiza um instante depois da mudança.
 * Em vez de ler logo em seguida, os testes esperam a condição ficar verdadeira (até um limite).
 * Não força o redesenho (detectChanges): se o componente não avisar o Angular, o teste falha,
 * e é isso que queremos pegar.
 */
import type { ComponentFixture } from '@angular/core/testing';

const LIMITE_MS = 1_000;
const INTERVALO_MS = 10;

export async function esperarAte(
  fixture: ComponentFixture<unknown>,
  condicao: () => boolean,
  descricao = 'a tela mudar',
): Promise<void> {
  const fim = Date.now() + LIMITE_MS;
  await fixture.whenStable();
  while (!condicao()) {
    if (Date.now() > fim) throw new Error(`Esperei ${LIMITE_MS} ms por ${descricao} e não aconteceu.`);
    await new Promise((pronto) => setTimeout(pronto, INTERVALO_MS));
    await fixture.whenStable();
  }
}
