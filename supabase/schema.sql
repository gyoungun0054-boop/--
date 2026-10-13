-- Apply this schema in the Supabase SQL Editor after creating an event.
-- Do not insert real attendee data into a public repository.

create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  participant_code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint participants_event_code_unique unique (event_id, participant_code)
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  participant_id uuid not null references public.participants(id) on delete restrict,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint check_ins_one_per_participant unique (event_id, participant_id)
);

create index if not exists participants_event_id_idx
  on public.participants(event_id);

create index if not exists check_ins_event_time_idx
  on public.check_ins(event_id, checked_in_at desc);

-- API access uses a server-only Supabase service role key. Do not expose it to
-- the browser or commit real keys. Enable RLS so direct anonymous table access
-- is denied; server-side service role operations bypass RLS by design.
alter table public.participants enable row level security;
alter table public.check_ins enable row level security;
