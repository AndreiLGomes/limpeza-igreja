/**
 * Peças de segurança (docs/05-seguranca.md). A senha de organizador (bcrypt) entra na Etapa 5.
 */
import { createHash, randomBytes } from 'node:crypto';

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
