/** Só liga o aplicativo na porta. */
import { criarAplicacao } from './aplicacao.js';
import { configuracao } from './configuracao.js';
import { criarRegistro } from './http/registro.js';

const registro = criarRegistro();

criarAplicacao({ registro }).listen(configuracao.PORTA, () => {
  registro.info(`Servidor no ar: http://localhost:${configuracao.PORTA}/api/saude`);
});
