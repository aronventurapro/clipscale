drop policy if exists "users manage own marketplace profile" on public.marketplace_profiles;
create policy "users insert own marketplace profile" on public.marketplace_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users update own marketplace profile" on public.marketplace_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users delete own marketplace profile" on public.marketplace_profiles for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "open marketplace offers are public" on public.marketplace_offers;
create policy "open marketplace offers are public" on public.marketplace_offers for select to anon, authenticated using (status = 'open' or owner_id = (select auth.uid()));
drop policy if exists "owners create marketplace offers" on public.marketplace_offers;
create policy "owners create marketplace offers" on public.marketplace_offers for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "owners update marketplace offers" on public.marketplace_offers;
create policy "owners update marketplace offers" on public.marketplace_offers for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "owners delete marketplace offers" on public.marketplace_offers;
create policy "owners delete marketplace offers" on public.marketplace_offers for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "applications visible to participants" on public.marketplace_applications;
create policy "applications visible to participants" on public.marketplace_applications for select to authenticated using (
  applicant_id = (select auth.uid()) or exists (select 1 from public.marketplace_offers o where o.id = offer_id and o.owner_id = (select auth.uid()))
);
drop policy if exists "users apply to open third party offers" on public.marketplace_applications;
create policy "users apply to open third party offers" on public.marketplace_applications for insert to authenticated with check (
  applicant_id = (select auth.uid()) and exists (select 1 from public.marketplace_offers o where o.id = offer_id and o.status = 'open' and o.owner_id <> (select auth.uid()))
);
drop policy if exists "participants update applications" on public.marketplace_applications;
create policy "participants update applications" on public.marketplace_applications for update to authenticated using (
  applicant_id = (select auth.uid()) or exists (select 1 from public.marketplace_offers o where o.id = offer_id and o.owner_id = (select auth.uid()))
) with check (
  applicant_id = (select auth.uid()) or exists (select 1 from public.marketplace_offers o where o.id = offer_id and o.owner_id = (select auth.uid()))
);

drop policy if exists "users manage own missions" on public.missions;
create policy "users manage own missions" on public.missions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "users manage own workspace settings" on public.workspace_settings;
create policy "users manage own workspace settings" on public.workspace_settings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
