import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Never cache moderation data.
export const dynamic = 'force-dynamic';

const COLUMNS = 'id, name, message, doodle, approved, created_at';
const id = z.string().uuid();

/** GET /api/admin/guestbook?status=pending|approved — up to 100 entries, newest first. */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const approved = req.nextUrl.searchParams.get('status') === 'approved';
  const { data, error } = await supabaseAdmin()
    .from('guestbook')
    .select(COLUMNS)
    .eq('approved', approved)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Could not load entries' }, { status: 500 });
  return NextResponse.json({ entries: data });
}

/** PATCH /api/admin/guestbook { id, approved } — publish or hide an entry. */
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = z.object({ id, approved: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { error } = await supabaseAdmin().from('guestbook').update({ approved: parsed.data.approved }).eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Could not update the entry' }, { status: 500 });
  // The homepage is cached (ISR); rebuild it now so the wall reflects the change on the next visit.
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/guestbook { id } — permanently remove an entry. */
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = z.object({ id }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { error } = await supabaseAdmin().from('guestbook').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Could not delete the entry' }, { status: 500 });
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
