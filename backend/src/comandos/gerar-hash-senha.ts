/**
 * Comando "npm run gerar-hash-senha": pede a senha de organizador sem mostrá-la na tela e
 * imprime o hash bcrypt para colocar no .env (SENHA_ORGANIZADOR_HASH). A senha pura não é gravada
 * em lugar nenhum.
 */
import { createInterface } from 'node:readline';
import { hashDeSenha } from '../comum/seguranca.js';

/** Tamanho mínimo pedido aqui para a senha não ser fácil de adivinhar. */
const SENHA_MIN = 8;

// Um leitor só para as duas perguntas: as linhas ficam numa fila, mesmo se chegarem juntas.
const leitor = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY ?? false });
// Não ecoa o que é digitado no terminal.
(leitor as unknown as { _writeToOutput: (texto: string) => void })._writeToOutput = () => {};
const linhas = leitor[Symbol.asyncIterator]();

async function perguntarEscondido(pergunta: string): Promise<string> {
  process.stdout.write(pergunta);
  const { value } = await linhas.next();
  process.stdout.write('\n');
  return typeof value === 'string' ? value : '';
}

function encerrarComErro(mensagem: string): never {
  console.error(mensagem);
  leitor.close();
  process.exit(1);
}

const senha = await perguntarEscondido('Digite a senha de organizador: ');
if (senha.length < SENHA_MIN) encerrarComErro(`A senha precisa ter pelo menos ${SENHA_MIN} caracteres. Nada foi gerado.`);
const repetida = await perguntarEscondido('Digite de novo para conferir: ');
if (repetida !== senha) encerrarComErro('As duas senhas não são iguais. Nada foi gerado.');
leitor.close();

const hash = await hashDeSenha(senha);
console.log('\nCopie a linha abaixo para o arquivo backend/.env (nunca para o git):\n');
// Aspas simples: o hash tem "$", e assim o .env não tenta interpretar.
console.log(`SENHA_ORGANIZADOR_HASH='${hash}'`);
