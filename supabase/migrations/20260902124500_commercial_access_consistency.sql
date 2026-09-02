-- Commercial processing is available only after Stripe or an explicit grant
-- has created an active subscription row. Never create a cost-bearing trial
-- implicitly from the processing endpoint.
update public.user_subscriptions
set status = 'inactive', updated_at = now()
where status = 'trialing' and stripe_subscription_id is null;

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

  select monthly_minutes into v_limit
  from public.user_subscriptions
  where user_id = v_user and status in ('trialing', 'active');
  if v_limit is null then raise exception 'subscription_inactive'; end if;

  select coalesce(sum(minutes), 0)::integer into v_used
  from public.usage_ledger
  where user_id = v_user
    and created_at >= date_trunc('month', now())
    and event_type = 'consume';

  if exists (
    select 1 from public.usage_ledger
    where user_id = v_user and video_id = p_video_id
      and event_type = 'consume'
      and description = 'Transcription et analyse vidéo'
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

revoke all on function public.reserve_video_minutes(uuid, integer) from public, anon;
grant execute on function public.reserve_video_minutes(uuid, integer) to authenticated;

create index if not exists processing_jobs_clip_id_idx
  on public.processing_jobs(clip_id) where clip_id is not null;
