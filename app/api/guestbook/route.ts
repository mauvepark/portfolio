import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { entrySchema, PAGE_SIZE, PUBLIC_COLUMNS } from '@/lib/guestbook';
import { supabasePublic } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const MAX_BODY_BYTES = 64 * 1024;
const RATE_LIMIT = 3; // posts per IP per hour

/** GET /api/guestbook?before=<iso timestamp> — next page of approved entries, newest first. */
export async function GET(req: NextRequest) {
  const before = req.nextUrl.searchParams.get('before');
  let query = supabasePublic()
    .from('guestbook')
    .select(PUBLIC_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load the wall' }, { status: 500 });
  return NextResponse.json({ entries: data });
}

/** POST /api/guestbook — validate, rate-limit, store as unapproved. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Doodle is too big' }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    // A filled honeypot means a bot; pretend it worked so it doesn't retry.
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return NextResponse.json({ ok: true }, { status: 201 });
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid entry' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const salt = process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const ipHash = createHash('sha256').update(salt + ip).digest('hex');

  const db = supabaseAdmin();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db
    .from('guestbook')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since);
  if (countError) return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({ error: 'That’s a lot of doodles! Try again in an hour.' }, { status: 429 });
  }

  const { name, message, doodle } = parsed.data;
  const { error } = await db.from('guestbook').insert({ name, message, doodle, ip_hash: ipHash });
  if (error) return NextResponse.json({ error: 'Could not save your entry' }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
