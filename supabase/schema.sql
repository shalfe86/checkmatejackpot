-- =========================================================
-- CHECKMATE JACKPOT - schema.sql
-- =========================================================
-- Creates tables:
--   profiles, jackpots, games, winners, payout_schedules, kyc_verification
-- Adds RLS and basic policies
-- Creates RPC:
--   submit_game(p_user_id, p_tier, p_result, p_prize) returns uuid
-- =========================================================

create extension if not exists "pgcrypto";

-- -------------------------
-- PROFILES
-- -------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  credits numeric(18,2) default 0,
  monthly_wins int default 0,
  tier_eligibility text default 'starter',
  country text,
  state_region text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles: users read own') then
    create policy "Profiles: users read own"
      on public.profiles for select
      using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles: users update own') then
    create policy "Profiles: users update own"
      on public.profiles for update
      using (auth.uid() = id);
  end if;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, credits)
  values (new.id, new.email, new.raw_user_meta_data->>'username', 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- -------------------------
-- JACKPOTS
-- -------------------------
create table if not exists public.jackpots (
  tier text primary key,                      -- 'starter' or 'world'
  amount numeric(18,2) not null default 5.00, -- current jackpot
  updated_at timestamptz default now()
);

alter table public.jackpots enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='jackpots' and policyname='Jackpots: read all') then
    create policy "Jackpots: read all"
      on public.jackpots for select
      using (true);
  end if;
end $$;

-- Seed default jackpots (safe if rerun)
insert into public.jackpots (tier, amount)
values ('starter', 5.00), ('world', 5.00)
on conflict (tier) do nothing;

-- -------------------------
-- GAMES
-- -------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null,          -- 'free', 'starter', 'world'
  result text not null,        -- 'win', 'loss', 'draw'
  prize numeric(18,2) default 0,
  created_at timestamptz default now()
);

create index if not exists games_user_id_idx on public.games(user_id);
create index if not exists games_created_at_idx on public.games(created_at);

alter table public.games enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='games' and policyname='Games: users read own') then
    create policy "Games: users read own"
      on public.games for select
      using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='games' and policyname='Games: users insert own') then
    create policy "Games: users insert own"
      on public.games for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- -------------------------
-- WINNERS
-- -------------------------
create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null,                       -- 'starter' or 'world'
  amount numeric(18,2) not null,            -- prize amount (gross jackpot at win time)
  payout_type text not null default 'annuity', -- 'cash' or 'annuity'
  status text not null default 'pending_verification',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists winners_set_updated_at on public.winners;
create trigger winners_set_updated_at
before update on public.winners
for each row execute procedure public.set_updated_at();

create index if not exists winners_user_id_idx on public.winners(user_id);
create index if not exists winners_created_at_idx on public.winners(created_at);

alter table public.winners enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='winners' and policyname='Winners: users read own') then
    create policy "Winners: users read own"
      on public.winners for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- -------------------------
-- PAYOUT SCHEDULES (installments)
-- -------------------------
create table if not exists public.payout_schedules (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references public.winners(id) on delete cascade,
  installment_number int not null,
  due_date date not null,
  amount numeric(18,2) not null,
  status text not null default 'scheduled', -- 'scheduled','sent','confirmed','cancelled'
  paid_at timestamptz,
  transaction_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (winner_id, installment_number)
);

drop trigger if exists payout_schedules_set_updated_at on public.payout_schedules;
create trigger payout_schedules_set_updated_at
before update on public.payout_schedules
for each row execute procedure public.set_updated_at();

alter table public.payout_schedules enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='payout_schedules' and policyname='Payouts: users read own') then
    create policy "Payouts: users read own"
      on public.payout_schedules for select
      using (
        exists (
          select 1 from public.winners w
          where w.id = payout_schedules.winner_id
            and w.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- -------------------------
-- KYC VERIFICATION (status only; do NOT store SSN here)
-- -------------------------
create table if not exists public.kyc_verification (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending',     -- 'pending','approved','rejected'
  doc_type text,
  doc_status text default 'not_submitted',    -- 'not_submitted','under_review','approved','rejected'
  country text,
  state_region text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists kyc_set_updated_at on public.kyc_verification;
create trigger kyc_set_updated_at
before update on public.kyc_verification
for each row execute procedure public.set_updated_at();

alter table public.kyc_verification enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='kyc_verification' and policyname='KYC: users read own') then
    create policy "KYC: users read own"
      on public.kyc_verification for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- =========================================================
-- RPC: submit_game
-- Matches frontend call keys:
--   { p_user_id, p_tier, p_result, p_prize }
-- Behavior:
--   - insert into games
--   - update jackpots:
--        loss: starter +0.75 up to 1000; world +1.00 no cap
--        win : reset tier jackpot to 5 and insert into winners
--   - return game id
-- =========================================================

drop function if exists public.submit_game(uuid, text, text, numeric);

create or replace function public.submit_game(
  p_user_id uuid,
  p_tier text,
  p_result text,
  p_prize numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_current numeric;
begin
  insert into public.games (user_id, tier, result, prize, created_at)
  values (p_user_id, p_tier, p_result, p_prize, now())
  returning id into v_game_id;

  if p_tier in ('starter','world') then
    -- ensure jackpot row exists
    insert into public.jackpots (tier, amount)
    values (p_tier, 5.00)
    on conflict (tier) do nothing;

    if p_result = 'win' then
      update public.jackpots
      set amount = 5.00, updated_at = now()
      where tier = p_tier;

      insert into public.winners (game_id, user_id, tier, amount, payout_type, status)
      values (v_game_id, p_user_id, p_tier, p_prize, 'annuity', 'pending_verification');

    elsif p_result = 'loss' then
      select amount into v_current from public.jackpots where tier = p_tier;

      if p_tier = 'starter' then
        update public.jackpots
        set amount = least(coalesce(v_current, 5.00) + 0.75, 1000),
            updated_at = now()
        where tier = 'starter';
      else
        update public.jackpots
        set amount = coalesce(v_current, 5.00) + 1.00,
            updated_at = now()
        where tier = 'world';
      end if;
    end if;
  end if;

  return v_game_id;
end;
$$;

-- =========================================================
-- END schema.sql
-- =========================================================
