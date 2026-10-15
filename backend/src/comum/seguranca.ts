/**
 * Peças de segurança (docs/05-seguranca.md).
 */
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

/** Custo do bcrypt para a senha de organizador (docs/05-seguranca.md). */
export const CUSTO_DO_HASH_DE_SENHA = 12;

/** Hash bcrypt da senha de organizador. Usado só pelo comando gerar-hash-senha. */
export function hashDeSenha(senha: string, custo = CUSTO_DO_HASH_DE_SENHA): Promise<string> {
  return bcrypt.hash(senha, custo);
}

/** Confere a senha com o hash, em tempo constante (a própria biblioteca garante). */
export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/** Código de cancelamento: 128 bits (C7). */
export const BYTES_DO_CODIGO = 16;
/** Token da sessão de organizador: 256 bits (O2). */
export const BYTES_DO_TOKEN = 32;

/** Texto aleatório de um gerador seguro, pronto para ir numa URL ou JSON. */
export function gerarToken(bytes: number): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Hash SHA-256 de um token, código ou IP. Basta para valores longos e aleatórios;
 * NÃO serve para a senha de organizador (essa usa bcrypt).
 */
export function hashDeToken(valor: string): string {
  return createHash('sha256').update(valor).digest('hex');
}

/** O IP é guardado só como hash (docs/05-seguranca.md). */
export function hashDeIp(ip: string): string {
  return hashDeToken(`ip:${ip}`);
}
