/**
 * "npm run desenvolver" na raiz: sobe tudo o que é preciso para trabalhar no app, com um comando só.
 * 1. o banco (docker compose), esperando ficar pronto;
 * 2. o pacote compartilhado compilado (o servidor e o site usam a versão compilada);
 * 3. a configuração do servidor (servidor/.env), que para tudo logo se faltar algo, como a senha;
 * 4. as migrações do banco (o banco de desenvolvimento recebe as tabelas e colunas novas sozinho);
 * 5. o servidor (porta 3000) e o site (porta 4200) juntos, com a saída de cada um marcada.
 * Ctrl+C encerra os dois. Sem dependência nova: só o Node.
 */
import { spawn, spawnSync } from 'node:child_process';

const ehWindows = process.platform === 'win32';

/** Roda um comando até o fim; se falhar, para tudo com a mensagem. */
function rodarAteOFim(descricao, comando) {
  console.log(`\n▶ ${descricao}…`);
  const resultado = spawnSync(comando, { stdio: 'inherit', shell: true });
  if (resultado.status !== 0) {
    console.error(`\n✖ Não deu para ${descricao.toLowerCase()}. Veja a mensagem acima.`);
    process.exit(resultado.status ?? 1);
  }
}

/** Liga um processo que fica rodando, com cada linha da saída marcada com o nome dele. */
function ligar(nome, comando) {
  const processo = spawn(comando, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const marcar = (destino) => (pedaco) => {
    for (const linha of pedaco.toString().split(/\r?\n/)) if (linha.trim()) destino.write(`[${nome}] ${linha}\n`);
  };
  processo.stdout.on('data', marcar(process.stdout));
  processo.stderr.on('data', marcar(process.stderr));
  processo.on('exit', (codigo) => {
    if (!encerrando) {
      console.error(`\n✖ O ${nome} parou (código ${codigo}). Encerrando o resto.`);
      encerrar(codigo ?? 1);
    }
  });
  return processo;
}

let encerrando = false;
const processos = [];

/** Encerra os processos e os filhos deles (no Windows, o npm abre outros processos por baixo). */
function encerrar(codigo = 0) {
  encerrando = true;
  for (const processo of processos) {
    if (processo.exitCode !== null) continue;
    if (ehWindows) spawnSync('taskkill', ['/PID', String(processo.pid), '/T', '/F'], { stdio: 'ignore' });
    else processo.kill('SIGTERM');
  }
  process.exit(codigo);
}

process.on('SIGINT', () => encerrar());
process.on('SIGTERM', () => encerrar());

rodarAteOFim('Subir o banco', 'docker compose up -d --wait');
rodarAteOFim('Compilar o pacote compartilhado', 'npm run build --workspace compartilhado');
rodarAteOFim('Conferir a configuração do servidor', 'npm run conferir-configuracao --workspace servidor --silent');
rodarAteOFim('Aplicar as migrações do banco', 'npm run migrar --workspace servidor --silent');

console.log('\n▶ Ligando o servidor e o site. O site abre em http://localhost:4200 (Ctrl+C para parar).\n');
processos.push(ligar('servidor', 'npm run desenvolver --workspace servidor'));
processos.push(ligar('site', 'npm start --workspace site'));
