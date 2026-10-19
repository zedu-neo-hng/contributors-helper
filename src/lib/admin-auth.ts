import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'zedu_admin_session';
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function adminCredentialsConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && sessionSecret());
}

function equalSecret(left: string, right: string) {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function verifyAdminCredentials(username: unknown, password: unknown) {
  if (!adminCredentialsConfigured() || typeof username !== 'string' || typeof password !== 'string') return false;
  return equalSecret(username, process.env.ADMIN_USERNAME!) && equalSecret(password, process.env.ADMIN_PASSWORD!);
}

export function createAdminSession() {
  const secret = sessionSecret();
  if (!secret) throw new Error('Admin session secret is not configured.');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ role: process.env.ADMIN_ROLE === 'lead' ? 'lead' : 'admin', expiresAt })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return { token: `${payload}.${signature}`, maxAge: SESSION_DURATION_SECONDS };
}

export function verifyAdminSession(token?: string) {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return false;
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: unknown; expiresAt?: unknown };
    return (session.role === 'admin' || session.role === 'lead') && typeof session.expiresAt === 'number' && session.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
