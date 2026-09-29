-- Run this in the Supabase SQL editor (additive)

create table if not exists kyc_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  full_name text,
  email text,
  phone text,
  status text not null default 'pending', -- 'pending' | 'submitted'
  consent_given boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists kyc_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references kyc_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null, -- 'photo' | 'national_id' | 'passport' | 'drivers_license' | 'other'
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_kyc_requests_token on kyc_requests(token);
create index if not exists idx_kyc_requests_user on kyc_requests(user_id);
create index if not exists idx_kyc_documents_request on kyc_documents(request_id);

-- PRIVATE bucket — unlike signatures, these files must never be publicly readable.
insert into storage.buckets (id, name, public)
values ('kyc-uploads', 'kyc-uploads', false)
on conflict (id) do nothing;

-- No storage policies granting read/write to anon or authenticated roles at all.
-- All access goes through the service-role key in API routes, which bypasses RLS —
-- files are only ever served via short-lived signed URLs generated on demand for
-- the owner, never a permanent public link.

alter table kyc_requests enable row level security;
alter table kyc_documents enable row level security;

create policy "Owner can read own kyc requests"
on kyc_requests for select
using (auth.uid() = user_id);

create policy "Owner can insert own kyc requests"
on kyc_requests for insert
with check (auth.uid() = user_id);

create policy "Owner can delete own kyc requests"
on kyc_requests for delete
using (auth.uid() = user_id);

create policy "Owner can read own kyc documents"
on kyc_documents for select
using (auth.uid() = user_id);
