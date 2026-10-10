import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-admin';

/** The one email allowed into /admin. Unset means the admin area is disabled. */
export function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

/**
 * Gate for admin API routes. Expects the Supabase session's access token as a Bearer token,
 * verifies it with Supabase, and only passes if the signed-in user is ADMIN_EMAIL with a
 * confirmed address. Returns an error response to send back, or null when allowed.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const allowed = adminEmail();
  if (!allowed) return NextResponse.json({ error: 'Admin is not configured' }, { status: 503 });

  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  const user = data?.user;
  if (error || !user) return NextResponse.json({ error: 'Session expired, sign in again' }, { status: 401 });
  if (user.email?.toLowerCase() !== allowed || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  return null;
}
