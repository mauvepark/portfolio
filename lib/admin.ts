import 'server-only';
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

/*
 * Admin auth: one username + password from env, a signed session cookie.
 *
 *   ADMIN_USERNAME       the username
 *   ADMIN_PASSWORD_HASH  "scrypt:<salt>:<hash>" from `npm run admin:hash` (the password itself is never stored)
 *
 * The cookie is "<expiry>.<hmac>", signed with a key derived from the service-role key and the
 * password hash, so changing the password signs everyone out.
 */
export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function config() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!username || !hash?.startsWith('scrypt:') || !secret) return null;
  return { username, hash, key: createHmac('sha256', secret).update(`admin-session:${hash}`).digest() };
}

const same = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);
const sign = (key: Buffer, value: string) => createHmac('sha256', key).update(value).digest('base64url');

/** Constant-time check of both username and password. */
export function verifyCredentials(username: string, password: string): boolean {
  const cfg = config();
  if (!cfg) return false;
  const [, salt, expected] = cfg.hash.split(':'); // ':' not '$': Next's .env loader expands $NAME
  const actual = scryptSync(password, Buffer.from(salt, 'base64'), 64);
  const userOk = same(Buffer.from(sign(cfg.key, username)), Buffer.from(sign(cfg.key, cfg.username)));
  const passOk = same(actual, Buffer.from(expected, 'base64'));
  return userOk && passOk;
}

export function isConfigured() {
  return config() !== null;
}

export function sessionCookieValue(): string | null {
  const cfg = config();
  if (!cfg) return null;
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  return `${exp}.${sign(cfg.key, exp)}`;
}

export function isSignedIn(req: NextRequest): boolean {
  const cfg = config();
  const value = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cfg || !value) return false;
  const [exp, mac] = value.split('.');
  if (!exp || !mac || Number(exp) < Date.now() / 1000) return false;
  return same(Buffer.from(mac), Buffer.from(sign(cfg.key, exp)));
}

/** Same-origin check for state-changing requests (defence in depth on top of SameSite=Strict). */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  return !origin || origin === req.nextUrl.origin;
}

/** Gate for admin API routes: returns an error response to send back, or null when allowed. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!isConfigured()) return NextResponse.json({ error: 'Admin is not configured' }, { status: 503 });
  if (req.method !== 'GET' && !sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
  if (!isSignedIn(req)) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  return null;
}
