import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { isConfigured, isSignedIn, sameOrigin, SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieValue, verifyCredentials } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/admin', // only ever sent to admin endpoints
};

/** GET /api/admin/session — am I signed in? */
export function GET(req: NextRequest) {
  return NextResponse.json({ configured: isConfigured(), signedIn: isSignedIn(req) });
}

/** POST /api/admin/session { username, password } — sign in. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
  if (!isConfigured()) return NextResponse.json({ error: 'Admin is not configured' }, { status: 503 });

  const parsed = z
    .object({ username: z.string().max(200), password: z.string().max(500) })
    .safeParse(await req.json().catch(() => null));

  if (!parsed.success || !verifyCredentials(parsed.data.username, parsed.data.password)) {
    // Slow down guessing. The real protection is a long, random password.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'Wrong username or password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionCookieValue()!, { ...cookieOptions, maxAge: SESSION_MAX_AGE });
  return res;
}

/** DELETE /api/admin/session — sign out. */
export function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return res;
}
