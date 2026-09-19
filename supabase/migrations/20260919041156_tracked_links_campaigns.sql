begin;

create extension if not exists pgcrypto;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 4000),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  channel text not null default 'manual' check (channel in ('whatsapp', 'email', 'sms', 'manual', 'other')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.tracked_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 4000),
  destination_url text not null check (destination_url ~* '^https?://[^[:space:]]+$'),
  tracking_type text not null check (tracking_type in ('general', 'individual')),
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{12,128}$'),
  source text not null default 'manual' check (source in ('whatsapp', 'email', 'sms', 'manual', 'other')),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (expires_at is null or expires_at > created_at)
);

create table public.tracked_link_recipients (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid not null references public.tracked_links(id) on delete restrict,
  recipient_type text not null check (recipient_type ~ '^[a-z_]{2,80}$'),
  recipient_id uuid not null,
  tracking_token text not null unique check (tracking_token ~ '^[A-Za-z0-9_-]{12,128}$'),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tracked_link_id, recipient_type, recipient_id)
);

create table public.tracked_link_events (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid not null references public.tracked_links(id) on delete restrict,
  tracked_link_recipient_id uuid references public.tracked_link_recipients(id) on delete set null,
  event_type text not null default 'click' check (event_type = 'click'),
  occurred_at timestamptz not null default now(),
  user_agent text check (char_length(user_agent) <= 400),
  referrer_origin text check (char_length(referrer_origin) <= 300),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create index campaigns_status_created_at_idx on public.campaigns(status, created_at desc);
create index tracked_links_campaign_id_idx on public.tracked_links(campaign_id);
create index tracked_links_active_expires_idx on public.tracked_links(is_active, expires_at);
create index tracked_link_recipients_link_id_idx on public.tracked_link_recipients(tracked_link_id);
create index tracked_link_recipients_recipient_idx on public.tracked_link_recipients(recipient_type, recipient_id);
create index tracked_link_events_link_occurred_idx on public.tracked_link_events(tracked_link_id, occurred_at desc);
create index tracked_link_events_recipient_occurred_idx on public.tracked_link_events(tracked_link_recipient_id, occurred_at desc) where tracked_link_recipient_id is not null;

create trigger campaigns_set_updated_at before update on public.campaigns for each row execute function private.set_updated_at();
create trigger tracked_links_set_updated_at before update on public.tracked_links for each row execute function private.set_updated_at();
create trigger campaigns_capture_audit after insert or update or delete on public.campaigns for each row execute function private.capture_administrative_audit();
create trigger tracked_links_capture_audit after insert or update or delete on public.tracked_links for each row execute function private.capture_administrative_audit();

alter table public.campaigns enable row level security;
alter table public.tracked_links enable row level security;
alter table public.tracked_link_recipients enable row level security;
alter table public.tracked_link_events enable row level security;

revoke all on public.campaigns, public.tracked_links, public.tracked_link_recipients, public.tracked_link_events from anon;
grant select, insert, update on public.campaigns, public.tracked_links, public.tracked_link_recipients, public.tracked_link_events to authenticated;
grant all on public.campaigns, public.tracked_links, public.tracked_link_recipients, public.tracked_link_events to service_role;

create policy campaigns_select on public.campaigns for select to authenticated using ((select private.has_portal_permission('operations.read')));
create policy campaigns_insert on public.campaigns for insert to authenticated with check ((select private.has_portal_permission('operations.manage')) and created_by = (select auth.uid()));
create policy campaigns_update on public.campaigns for update to authenticated using ((select private.has_portal_permission('operations.manage'))) with check ((select private.has_portal_permission('operations.manage')));
create policy tracked_links_select on public.tracked_links for select to authenticated using ((select private.has_portal_permission('operations.read')));
create policy tracked_links_insert on public.tracked_links for insert to authenticated with check ((select private.has_portal_permission('operations.manage')) and created_by = (select auth.uid()));
create policy tracked_links_update on public.tracked_links for update to authenticated using ((select private.has_portal_permission('operations.manage'))) with check ((select private.has_portal_permission('operations.manage')));
create policy tracked_link_recipients_select on public.tracked_link_recipients for select to authenticated using ((select private.has_portal_permission('operations.read')));
create policy tracked_link_recipients_write on public.tracked_link_recipients for all to authenticated using ((select private.has_portal_permission('operations.manage'))) with check ((select private.has_portal_permission('operations.manage')));
create policy tracked_link_events_select on public.tracked_link_events for select to authenticated using ((select private.has_portal_permission('operations.read')));

comment on table public.tracked_link_events is 'Click events use data minimization: no IP, fingerprint, precise location, or full referrer is stored.';
commit;
