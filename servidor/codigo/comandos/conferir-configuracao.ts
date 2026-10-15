/**
 * "npm run conferir-configuracao": confere o servidor/.env antes de ligar o servidor.
 * Usado pelo "npm run desenvolver" da raiz, para avisar logo (e parar) se faltar algo, como a senha.
 */
try {
  // O módulo lê e confere o ambiente assim que é carregado; por isso o import fica dentro do try.
  await import('../configuracao.js');
  console.log('  ✓ Configuração do servidor OK.');
} catch (erro) {
  console.error(`\n${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
}
