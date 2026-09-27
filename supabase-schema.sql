-- Run this in the Supabase SQL editor (replaces the v1 schema)

create table if not exists signature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  signer_name text,
  signer_email text,
  status text not null default 'pending', -- 'pending' | 'signed'
  signature_url text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_signature_requests_token on signature_requests(token);
create index if not exists idx_signature_requests_user on signature_requests(user_id);

-- Storage bucket for the signature PNGs
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true)
on conflict (id) do nothing;

-- Storage: public read (signature images are meant to be viewable via their URL),
-- but only the service role (server-side API routes) can write.
create policy "Public read signatures"
on storage.objects for select
using (bucket_id = 'signatures');

-- No public insert policy on storage.objects — uploads only happen server-side
-- using the service role key, which bypasses RLS entirely.

-- Row Level Security: owners only. Public sign-page access goes through a
-- server-side API route using the service role key, never direct client queries,
-- so no public select/insert/update policy is needed here at all.
alter table signature_requests enable row level security;

create policy "Owner can read own requests"
on signature_requests for select
using (auth.uid() = user_id);

create policy "Owner can insert own requests"
on signature_requests for insert
with check (auth.uid() = user_id);

create policy "Owner can update own requests"
on signature_requests for update
using (auth.uid() = user_id);
