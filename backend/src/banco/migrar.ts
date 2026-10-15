/** Comando "npm run migrar": cria ou atualiza as tabelas no banco do .env. */
import { config } from '../config.js';
import { aplicarMigracoes } from './aplicar-migracoes.js';

await aplicarMigracoes(config.urlDoBanco);
console.log('Migrações aplicadas.');
