-- =========================================================
-- Day 2 Migration: credit_ledger, audit_log, flags
-- Safe to run multiple times (IF NOT EXISTS + policy guards)
-- =========================================================

create extension if not exists "pgcrypto";

-- -------------------------
-- 0) Ensure profiles.role exists (admin gating)
-- -------------------------
alter table public.profiles
  add column if not exists role text default 'user';

-- -------------------------
-- 1) CREDIT LEDGER
-- -------------------------
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  direction text not null check (direction in ('credit','debit')),
  amount numeric(18,2) not null check (amount > 0),

  type text not null check (type in (
    'stripe_purchase',
    'game_entry',
    'refund',
    'chargeback',
    'admin_adjustment',
    'promo_bonus'
  )),

  game_id uuid references public.games(id) on delete set null,
  winner_id uuid references public.winners(id) on delete set null,

  stripe_payment_intent_id text,
  stripe_checkout_session_id text,

  note text,
  created_at timestamptz default now()
);

create index if not exists credit_ledger_user_id_idx on public.credit_ledger(user_id);
create index if not exists credit_ledger_created_at_idx on public.credit_ledger(created_at);

alter table public.credit_ledger enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='credit_ledger'
      and policyname='Credit ledger: users read own'
  ) then
    create policy "Credit ledger: users read own"
      on public.credit_ledger for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='credit_ledger'
      and policyname='Credit ledger: admins read all'
  ) then
    create policy "Credit ledger: admins read all"
      on public.credit_ledger for select
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

-- OPTIONAL: keep profiles.credits in sync when ledger entries are inserted
create or replace function public.apply_credit_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction = 'credit' then
    update public.profiles
      set credits = coalesce(credits, 0) + new.amount
    where id = new.user_id;
  else
    update public.profiles
      set credits = coalesce(credits, 0) - new.amount
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists credit_ledger_apply on public.credit_ledger;
create trigger credit_ledger_apply
after insert on public.credit_ledger
for each row execute procedure public.apply_credit_ledger_entry();

-- -------------------------
-- 2) AUDIT LOG
-- -------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),

  actor_user_id uuid references auth.users(id) on delete set null,

  target_user_id uuid references auth.users(id) on delete set null,
  target_game_id uuid references public.games(id) on delete set null,
  target_winner_id uuid references public.winners(id) on delete set null,

  action text not null,        -- e.g. 'KYC_APPROVED', 'PAYOUT_SENT', 'FLAG_CREATED'
  message text,
  metadata jsonb,

  created_at timestamptz default now()
);

create index if not exists audit_log_actor_idx on public.audit_log(actor_user_id);
create index if not exists audit_log_target_user_idx on public.audit_log(target_user_id);
create index if not exists audit_log_created_at_idx on public.audit_log(created_at);

alter table public.audit_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='audit_log'
      and policyname='Audit log: admins read'
  ) then
    create policy "Audit log: admins read"
      on public.audit_log for select
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='audit_log'
      and policyname='Audit log: admins insert'
  ) then
    create policy "Audit log: admins insert"
      on public.audit_log for insert
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

-- -------------------------
-- 3) FLAGS / REVIEWS
-- -------------------------
create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),

  target_user_id uuid references auth.users(id) on delete cascade,
  target_game_id uuid references public.games(id) on delete set null,
  target_winner_id uuid references public.winners(id) on delete set null,

  created_by uuid references auth.users(id) on delete set null,

  status text not null default 'open'
    check (status in ('open','investigating','cleared','confirmed','action_taken','closed')),

  reason text not null
    check (reason in (
      'engine_assistance_suspected',
      'multi_accounting',
      'vpn_or_location_mismatch',
      'payment_fraud',
      'chargeback_risk',
      'kyc_mismatch',
      'abusive_behavior',
      'technical_anomaly',
      'other'
    )),

  severity text not null default 'medium'
    check (severity in ('low','medium','high','critical')),

  summary text,
  evidence jsonb,

  assigned_to uuid references auth.users(id) on delete set null,
  resolution text,
  action_taken text,
  resolved_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists flags_target_user_idx on public.flags(target_user_id);
create index if not exists flags_status_idx on public.flags(status);
create index if not exists flags_created_at_idx on public.flags(created_at);

-- updated_at trigger (re-use your existing set_updated_at trigger)
drop trigger if exists flags_set_updated_at on public.flags;
create trigger flags_set_updated_at
before update on public.flags
for each row execute procedure public.set_updated_at();

alter table public.flags enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='flags'
      and policyname='Flags: admins read'
  ) then
    create policy "Flags: admins read"
      on public.flags for select
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='flags'
      and policyname='Flags: admins insert'
  ) then
    create policy "Flags: admins insert"
      on public.flags for insert
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='flags'
      and policyname='Flags: admins update'
  ) then
    create policy "Flags: admins update"
      on public.flags for update
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

-- =========================================================
-- END Day 2 Migration
-- =========================================================
