begin;

create table public.pending_invites (
  email text primary key,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  role public.portal_role not null,
  company_id uuid references public.companies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint pending_invites_company_role_check check (
    (role = 'company' and company_id is not null)
    or role is distinct from 'company'
  )
);

create index pending_invites_company_id_idx on public.pending_invites(company_id);
create index pending_invites_created_by_idx on public.pending_invites(created_by);

alter table public.pending_invites enable row level security;

create policy pending_invites_client_deny on public.pending_invites
as restrictive
for all to anon, authenticated
using (false)
with check (false);

revoke all on public.pending_invites from public, anon, authenticated;
grant select, insert, update, delete on public.pending_invites to service_role;

create function private.enforce_portal_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ->> 'portal_role' in ('cafcm_admin', 'apprentice', 'company') then
    return new;
  end if;

  if exists (
    select 1
    from public.pending_invites invite
    where lower(invite.email) = lower(new.email)
      and invite.created_at > now() - interval '7 days'
  ) then
    return new;
  end if;

  raise exception 'O Portal CAFCM permite somente contas criadas por convite.';
end;
$$;

create or replace function private.sync_portal_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  portal_role_value public.portal_role;
  company_value uuid;
  pending public.pending_invites%rowtype;
  profile_name text;
begin
  select invite.*
  into pending
  from public.pending_invites invite
  where lower(invite.email) = lower(new.email)
  limit 1;

  portal_role_value := case new.raw_app_meta_data ->> 'portal_role'
    when 'cafcm_admin' then 'cafcm_admin'::public.portal_role
    when 'apprentice' then 'apprentice'::public.portal_role
    when 'company' then 'company'::public.portal_role
    else pending.role
  end;

  company_value := case
    when coalesce(new.raw_app_meta_data ->> 'company_id', '') ~
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    then (new.raw_app_meta_data ->> 'company_id')::uuid
    else pending.company_id
  end;

  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    pending.full_name,
    ''
  );

  insert into public.profiles (id, full_name, role, company_id)
  values (new.id, profile_name, portal_role_value, company_value)
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    company_id = excluded.company_id,
    updated_at = now();

  insert into public.profile_contacts (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

create trigger enforce_portal_invite_before_auth_user
before insert on auth.users
for each row execute function private.enforce_portal_invite();

revoke all on function private.enforce_portal_invite() from public, anon, authenticated;

commit;
