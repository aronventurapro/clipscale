alter table public.support_tickets alter column workspace_id drop not null;
drop policy if exists support_own_access on public.support_tickets;
create policy support_own_access on public.support_tickets
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      workspace_id is null
      or workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
    )
  );

alter table public.studio_videos
  add column if not exists retention_until timestamptz not null default (now() + interval '30 days'),
  add column if not exists deleted_at timestamptz;
create index if not exists studio_videos_retention_idx
  on public.studio_videos(retention_until)
  where deleted_at is null;
