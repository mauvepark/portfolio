-- Doodle guestbook.
-- Visitors never write to this table directly: inserts go through /api/guestbook,
-- which validates, rate-limits and writes with the service role key.
-- New entries start unapproved; flip `approved` to true in the Table Editor to publish one.

create table if not exists public.guestbook (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  message     text not null default '' check (char_length(message) <= 280),
  -- [{ "c": 0 | 1, "p": [x0, y0, x1, y1, ...] }] in a 320x240 box; c = 0 graphite, 1 accent
  doodle      jsonb not null default '[]'::jsonb,
  approved    boolean not null default false,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  constraint has_content check (char_length(message) > 0 or jsonb_array_length(doodle) > 0)
);

create index if not exists guestbook_wall_idx on public.guestbook (created_at desc) where approved;
create index if not exists guestbook_rate_idx on public.guestbook (ip_hash, created_at desc);

-- Row level security: the public (anon) key can only read approved entries.
-- No insert/update/delete policies, so only the service role can write.
alter table public.guestbook enable row level security;

drop policy if exists "approved entries are public" on public.guestbook;
create policy "approved entries are public"
  on public.guestbook for select
  to anon, authenticated
  using (approved);

-- Hide moderation fields from the public key (column-level grants).
revoke select on public.guestbook from anon, authenticated;
grant select (id, name, message, doodle, approved, created_at) on public.guestbook to anon, authenticated;

-- Live wall: stream changes (RLS still applies, so only approved rows reach visitors).
do $$
begin
  alter publication supabase_realtime add table public.guestbook;
exception when duplicate_object then null;
end $$;
