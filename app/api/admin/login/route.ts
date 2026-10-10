import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { adminEmail } from '@/lib/admin';

const body = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

/**
 * POST /api/admin/login — email a magic sign-in link, but only to ADMIN_EMAIL.
 * Always answers the same way so the endpoint doesn't reveal which address is the admin's.
 */
export async function POST(req: NextRequest) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  const done = NextResponse.json({ ok: true, message: 'If that’s the admin email, a sign-in link is on its way.' });
  if (!parsed.success || parsed.data.email !== adminEmail()) return done;

  // Implicit flow: the link lands on /admin with the session in the URL fragment, which the
  // browser client picks up (a PKCE flow would need a verifier stored in that browser).
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, flowType: 'implicit' },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: true, emailRedirectTo: `${req.nextUrl.origin}/admin` },
  });
  if (error) {
    // e.g. Supabase's email rate limit; worth telling the admin, and only the admin gets here.
    return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
  }
  return done;
}
