/** Comando "npm run migrar": cria ou atualiza as tabelas no banco do .env. */
import { configuracao } from '../configuracao.js';
import { aplicarMigracoes } from './aplicar-migracoes.js';

await aplicarMigracoes(configuracao.urlDoBanco);
console.log('Migrações aplicadas.');
