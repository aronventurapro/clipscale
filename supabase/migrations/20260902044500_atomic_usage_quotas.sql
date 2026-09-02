create unique index if not exists usage_ledger_video_processing_once_idx
  on public.usage_ledger(user_id, video_id, event_type)
  where event_type = 'video_processed';

create or replace function public.reserve_video_minutes(
  p_video_id uuid,
  p_minutes integer
) returns table(used_minutes integer, limit_minutes integer, remaining_minutes integer)
language plpgsql
security definer
set search_path = ''
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

  select monthly_minutes into v_limit
  from public.user_subscriptions
  where user_id = v_user and status in ('trialing', 'active');
  if v_limit is null then raise exception 'subscription_inactive'; end if;

  select coalesce(sum(minutes), 0)::integer into v_used
  from public.usage_ledger
  where user_id = v_user
    and created_at >= date_trunc('month', now())
    and event_type in ('video_processed', 'render_created');

  if exists (select 1 from public.usage_ledger where user_id = v_user and video_id = p_video_id and event_type = 'video_processed') then
    return query select v_used, v_limit, greatest(v_limit - v_used, 0);
    return;
  end if;
  if v_used + p_minutes > v_limit then raise exception 'quota_exceeded'; end if;

  insert into public.usage_ledger(user_id, video_id, event_type, minutes, description)
  values (v_user, p_video_id, 'video_processed', p_minutes, 'Transcription et analyse vidéo');
  return query select v_used + p_minutes, v_limit, greatest(v_limit - v_used - p_minutes, 0);
end;
$$;

revoke all on function public.reserve_video_minutes(uuid, integer) from public;
grant execute on function public.reserve_video_minutes(uuid, integer) to authenticated;
