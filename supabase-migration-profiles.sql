-- Run this in the Supabase SQL editor (additive — safe to run on your existing project)

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Owner can read own profile"
on profiles for select
using (auth.uid() = id);

create policy "Owner can insert own profile"
on profiles for insert
with check (auth.uid() = id);

create policy "Owner can update own profile"
on profiles for update
using (auth.uid() = id);

-- Auto-create an empty profile row the moment someone signs up, so the
-- dashboard always has a row to update rather than needing an upsert.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill a profile row for any existing account created before this migration
insert into profiles (id)
select id from auth.users
on conflict (id) do nothing;
