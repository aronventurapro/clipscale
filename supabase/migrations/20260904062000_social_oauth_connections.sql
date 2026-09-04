create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('youtube','instagram','facebook','tiktok','linkedin')),
  provider_account_id text,
  provider_account_name text,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected','expired','revoked','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, platform)
);

alter table public.social_connections enable row level security;
revoke all on public.social_connections from anon, authenticated;
create index if not exists social_connections_user_id_idx on public.social_connections(user_id);
