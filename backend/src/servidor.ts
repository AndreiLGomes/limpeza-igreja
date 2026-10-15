/** Só liga o app na porta. */
import { criarApp } from './app.js';
import { config } from './config.js';
import { criarLog } from './http/log.js';

const log = criarLog();

criarApp({ log }).listen(config.PORTA, () => {
  log.info(`Servidor no ar: http://localhost:${config.PORTA}/api/saude`);
});
