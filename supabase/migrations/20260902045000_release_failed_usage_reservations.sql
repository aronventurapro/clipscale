create or replace function public.release_video_minutes(p_video_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  delete from public.usage_ledger
  where user_id = auth.uid()
    and video_id = p_video_id
    and event_type = 'video_processed'
    and not exists (
      select 1 from public.processing_jobs
      where processing_jobs.user_id = auth.uid()
        and processing_jobs.video_id = p_video_id
    );
end;
$$;
revoke all on function public.release_video_minutes(uuid) from public;
grant execute on function public.release_video_minutes(uuid) to authenticated;
