create table if not exists public.marketplace_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 70),
  bio text not null default '' check (char_length(bio) <= 500),
  skills text not null default '' check (char_length(skills) <= 200),
  portfolio_url text not null default '' check (char_length(portfolio_url) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 90),
  client_name text not null check (char_length(client_name) between 2 and 70),
  description text not null check (char_length(description) between 30 and 1200),
  platforms text not null check (char_length(platforms) between 1 and 120),
  budget_cents integer not null check (budget_cents >= 1000),
  cpm_cents integer not null default 0 check (cpm_cents >= 0),
  status text not null default 'open' check (status in ('open','paused','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_applications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.marketplace_offers(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 20 and 900),
  portfolio_url text not null default '' check (char_length(portfolio_url) <= 400),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, applicant_id)
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null check (char_length(client_name) between 1 and 100),
  title text not null check (char_length(title) between 2 and 120),
  target_clips integer not null default 1 check (target_clips between 1 and 10000),
  completed_clips integer not null default 0 check (completed_clips >= 0),
  due_date date,
  status text not null default 'planned' check (status in ('planned','active','review','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_name text not null default 'ClipScale Studio' check (char_length(workspace_name) between 2 and 100),
  contact_email text not null default '' check (char_length(contact_email) <= 320),
  timezone text not null default 'Europe/Paris' check (char_length(timezone) between 3 and 80),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_profiles enable row level security;
alter table public.marketplace_offers enable row level security;
alter table public.marketplace_applications enable row level security;
alter table public.missions enable row level security;
alter table public.workspace_settings enable row level security;

create policy "marketplace profiles readable by signed users" on public.marketplace_profiles for select to authenticated using (true);
create policy "users manage own marketplace profile" on public.marketplace_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "open marketplace offers are public" on public.marketplace_offers for select to anon, authenticated using (status = 'open' or owner_id = auth.uid());
create policy "owners create marketplace offers" on public.marketplace_offers for insert to authenticated with check (owner_id = auth.uid());
create policy "owners update marketplace offers" on public.marketplace_offers for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete marketplace offers" on public.marketplace_offers for delete to authenticated using (owner_id = auth.uid());
create policy "applications visible to participants" on public.marketplace_applications for select to authenticated using (
  applicant_id = auth.uid() or exists (select 1 from public.marketplace_offers o where o.id = offer_id and o.owner_id = auth.uid())
);
create policy "users apply to open third party offers" on public.marketplace_applications for insert to authenticated with check (
  applicant_id = auth.uid() and exists (select 1 from public.marketplace_offers o where o.id = offer_id and o.status = 'open' and o.owner_id <> auth.uid())
);
create policy "participants update applications" on public.marketplace_applications for update to authenticated using (
  applicant_id = auth.uid() or exists (select 1 from public.marketplace_offers o where o.id = offer_id and o.owner_id = auth.uid())
);
create policy "users manage own missions" on public.missions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own workspace settings" on public.workspace_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists marketplace_offers_status_created_idx on public.marketplace_offers(status, created_at desc);
create index if not exists marketplace_offers_owner_idx on public.marketplace_offers(owner_id, created_at desc);
create index if not exists marketplace_applications_offer_idx on public.marketplace_applications(offer_id, created_at desc);
create index if not exists marketplace_applications_applicant_idx on public.marketplace_applications(applicant_id, created_at desc);
create index if not exists missions_user_created_idx on public.missions(user_id, created_at desc);
