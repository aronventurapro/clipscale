revoke execute on function public.reserve_video_minutes(uuid, integer) from anon;
revoke execute on function public.release_video_minutes(uuid) from anon;

drop policy if exists support_own_access on public.support_tickets;
create policy support_own_access on public.support_tickets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      workspace_id is null
      or workspace_id in (
        select workspace_id
        from public.workspace_members
        where user_id = (select auth.uid())
      )
    )
  );
