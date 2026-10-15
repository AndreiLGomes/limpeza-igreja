/**
 * hoje(): a data de hoje em America/Sao_Paulo (D1), no formato "AAAA-MM-DD".
 * É o ÚNICO lugar do código que sabe o fuso horário do aplicativo.
 */
const FUSO_DO_APP = 'America/Sao_Paulo';

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
