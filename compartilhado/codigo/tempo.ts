/**
 * hoje() e horaAgora(): a data e a hora de agora em America/Sao_Paulo (D1), "AAAA-MM-DD" e "HH:MM".
 * É o ÚNICO lugar do código que sabe o fuso horário do aplicativo: o servidor, o site e os testes usam este.
 */
export const FUSO_DO_APP = 'America/Sao_Paulo';

/** "en-CA" escreve a data como AAAA-MM-DD, sem depender do idioma do servidor. */
const formatoDeData = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_DO_APP,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function hoje(agora: Date = new Date()): string {
  return formatoDeData.format(agora);
}

/** "en-GB" com h23 escreve a hora como HH:MM (00 a 23), sem depender do idioma do servidor. */
const formatoDeHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO_DO_APP,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** L5: a hora de agora em São Paulo, "HH:MM". Quem manda é o relógio do servidor, não o do celular. */
export function horaAgora(agora: Date = new Date()): string {
  return formatoDeHora.format(agora);
}

/** "2026-11-03T22:32:00Z" → "03/11 às 19:32" (São Paulo): a assinatura na folha. */
export function dataEHoraCurtas(iso: string): string {
  const momento = new Date(iso);
  const [, mes, dia] = hoje(momento).split('-');
  return `${dia}/${mes} às ${horaAgora(momento)}`;
}
