alter table public.user_subscriptions
  add column if not exists monthly_rendered_minutes integer not null default 0,
  add column if not exists member_limit integer not null default 1,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.user_subscriptions
  add constraint user_subscriptions_source_minutes_valid check (monthly_minutes between 0 and 100000),
  add constraint user_subscriptions_rendered_minutes_valid check (monthly_rendered_minutes between 0 and 100000),
  add constraint user_subscriptions_member_limit_valid check (member_limit between 1 and 1000);

create unique index if not exists user_subscriptions_stripe_customer_idx
  on public.user_subscriptions(stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists user_subscriptions_stripe_subscription_idx
  on public.user_subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

create table if not exists public.stripe_webhook_events (
  event_id text primary key check (event_id ~ '^evt_[A-Za-z0-9]+$'),
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

comment on table public.stripe_webhook_events is 'Stripe webhook idempotency ledger; service role only.';
