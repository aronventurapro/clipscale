alter table public.processing_jobs
  add column if not exists workflow_run_id text,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists failure_code text,
  add column if not exists cancel_requested_at timestamptz,
  add column if not exists clip_id uuid references public.studio_clips(id) on delete set null;

create unique index if not exists processing_jobs_one_active_analysis_idx
  on public.processing_jobs(user_id, video_id)
  where status in ('queued', 'processing') and job_type in ('transcribe', 'analyse');

create index if not exists processing_jobs_workflow_run_idx
  on public.processing_jobs(workflow_run_id)
  where workflow_run_id is not null;

create index if not exists processing_jobs_recovery_idx
  on public.processing_jobs(status, next_attempt_at, lease_expires_at)
  where status in ('queued', 'processing', 'failed');

create unique index if not exists processing_jobs_one_active_render_idx
  on public.processing_jobs(user_id, clip_id)
  where status in ('queued', 'processing') and job_type = 'render' and clip_id is not null;

alter table public.studio_clips
  add column if not exists source_job_id uuid references public.processing_jobs(id) on delete set null;

create unique index if not exists studio_clips_job_time_unique_idx
  on public.studio_clips(source_job_id, start_seconds, end_seconds);

create unique index if not exists usage_ledger_video_processing_consume_idx
  on public.usage_ledger(user_id, video_id)
  where event_type = 'consume' and description = 'Transcription et analyse vidéo';

create or replace function public.reserve_video_minutes(p_video_id uuid, p_minutes integer)
returns table(used_minutes integer, limit_minutes integer, remaining_minutes integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer;
  v_used integer;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if p_minutes < 1 or p_minutes > 360 then raise exception 'invalid_minutes'; end if;
  if not exists (select 1 from public.studio_videos where id = p_video_id and user_id = v_user) then raise exception 'video_not_found'; end if;
  perform pg_advisory_xact_lock(hashtext(v_user::text));
  insert into public.user_subscriptions(user_id, plan, status, monthly_minutes)
  values (v_user, 'starter', 'trialing', 60)
  on conflict (user_id) do nothing;
  select monthly_minutes into v_limit from public.user_subscriptions where user_id = v_user and status in ('trialing', 'active');
  if v_limit is null then raise exception 'subscription_inactive'; end if;
  select coalesce(sum(minutes), 0)::integer into v_used
  from public.usage_ledger
  where user_id = v_user and created_at >= date_trunc('month', now()) and event_type = 'consume';
  if exists (
    select 1 from public.usage_ledger
    where user_id = v_user and video_id = p_video_id and event_type = 'consume' and description = 'Transcription et analyse vidéo'
  ) then
    return query select v_used, v_limit, greatest(v_limit - v_used, 0);
    return;
  end if;
  if v_used + p_minutes > v_limit then raise exception 'quota_exceeded'; end if;
  insert into public.usage_ledger(user_id, video_id, event_type, minutes, description)
  values (v_user, p_video_id, 'consume', p_minutes, 'Transcription et analyse vidéo');
  return query select v_used + p_minutes, v_limit, greatest(v_limit - v_used - p_minutes, 0);
end;
$$;

create or replace function public.release_video_minutes(p_video_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  delete from public.usage_ledger
  where user_id = auth.uid()
    and video_id = p_video_id
    and event_type = 'consume'
    and description = 'Transcription et analyse vidéo'
    and not exists (
      select 1 from public.processing_jobs
      where processing_jobs.user_id = auth.uid()
        and processing_jobs.video_id = p_video_id
        and processing_jobs.status in ('queued', 'processing', 'completed')
        and processing_jobs.job_type in ('transcribe', 'analyse')
    );
end;
$$;

revoke all on function public.reserve_video_minutes(uuid, integer) from public, anon;
revoke all on function public.release_video_minutes(uuid) from public, anon;
grant execute on function public.reserve_video_minutes(uuid, integer) to authenticated;
grant execute on function public.release_video_minutes(uuid) to authenticated;
