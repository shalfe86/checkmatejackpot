-- =========================================================
-- CHECKMATE JACKPOT - Unified Schema
-- =========================================================
-- This schema includes:
-- 1. Core Tables: profiles, jackpots, games, winners
-- 2. Finance/Admin: payout_schedules, credit_ledger, audit_log, flags, kyc_verification
-- 3. Game Logic: secure server-side validation columns and functions
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. UTILITY FUNCTIONS
-- =========================================================

-- Trigger function to auto-update 'updated_at' columns
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =========================================================
-- 2. PROFILES (Users)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  credits numeric(18,2) default 0,
  monthly_wins int default 0,
  tier_eligibility text default 'starter',
  role text default 'user', -- 'user' or 'admin'
  country text,
  state_region text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

-- Policies
create policy "Profiles: users read own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles: users update own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username, credits, role)
  values (new.id, new.email, new.raw_user_meta_data->>'username', 0, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- =========================================================
-- 11. MOVE HISTORY
-- =========================================================
create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  ply int not null,
  player text not null check (player in ('user','ai')),
  san text not null,
  from_sq text,
  to_sq text,
  fen_before text not null,
  fen_after text not null,
  created_at timestamptz default now()
);

create index if not exists moves_game_id_idx on public.moves(game_id);

alter table public.moves enable row level security;

-- Policies: users can read their own game's moves
create policy "Moves: users read own" on public.moves for select using (
  exists (select 1 from public.games g where g.id = public.moves.game_id and g.user_id = auth.uid())
);

-- Users cannot insert moves directly via anon key; allow inserts only when the caller is the game owner
create policy "Moves: users insert own" on public.moves for insert with check (
  exists (select 1 from public.games g where g.id = game_id and g.user_id = auth.uid())
);



drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================
-- 3. JACKPOTS
-- =========================================================
create table if not exists public.jackpots (
  tier text primary key,                      -- 'starter' or 'world'
  amount numeric(18,2) not null default 5.00, -- current jackpot
  updated_at timestamptz default now()
);

alter table public.jackpots enable row level security;
create policy "Jackpots: read all" on public.jackpots for select using (true);

-- Seed default jackpots
insert into public.jackpots (tier, amount)
values ('starter', 5.00), ('world', 5.00)
on conflict (tier) do nothing;

-- =========================================================
-- 4. GAMES
-- =========================================================
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null,          -- 'free', 'starter', 'world'
  
  -- Game State (Server Authority)
  status text not null default 'active', -- 'active', 'completed'
  result text not null default 'active', -- 'active', 'win', 'loss', 'draw'
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn text default '',
  
  prize numeric(18,2) default 0,
  created_at timestamptz default now()
);

create index if not exists games_user_id_idx on public.games(user_id);
create index if not exists games_created_at_idx on public.games(created_at);

alter table public.games enable row level security;

-- Users can read their own games
create policy "Games: users read own" on public.games for select using (auth.uid() = user_id);
-- Users can insert their own games (to start them)
create policy "Games: users insert own" on public.games for insert with check (auth.uid() = user_id);
-- Note: UPDATES are blocked for users. Only the Edge Function (Service Role) can update moves/results.

-- =========================================================
-- 5. WINNERS
-- =========================================================
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

alter table public.winners enable row level security;
create policy "Winners: users read own" on public.winners for select using (auth.uid() = user_id);

-- =========================================================
-- 6. PAYOUT SCHEDULES
-- =========================================================
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

create policy "Payouts: users read own" on public.payout_schedules for select using (
  exists (select 1 from public.winners w where w.id = payout_schedules.winner_id and w.user_id = auth.uid())
);

-- =========================================================
-- 7. CREDIT LEDGER
-- =========================================================
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('credit','debit')),
  amount numeric(18,2) not null check (amount > 0),
  type text not null check (type in ('stripe_purchase', 'game_entry', 'refund', 'chargeback', 'admin_adjustment', 'promo_bonus')),
  game_id uuid references public.games(id) on delete set null,
  winner_id uuid references public.winners(id) on delete set null,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  note text,
  created_at timestamptz default now()
);

alter table public.credit_ledger enable row level security;

create policy "Credit ledger: users read own" on public.credit_ledger for select using (auth.uid() = user_id);
create policy "Credit ledger: admins read all" on public.credit_ledger for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Sync profiles.credits with ledger
create or replace function public.apply_credit_ledger_entry()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.direction = 'credit' then
    update public.profiles set credits = coalesce(credits, 0) + new.amount where id = new.user_id;
  else
    update public.profiles set credits = coalesce(credits, 0) - new.amount where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists credit_ledger_apply on public.credit_ledger;
create trigger credit_ledger_apply
after insert on public.credit_ledger
for each row execute procedure public.apply_credit_ledger_entry();

-- =========================================================
-- 8. KYC VERIFICATION
-- =========================================================
create table if not exists public.kyc_verification (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending',     -- 'pending','approved','rejected'
  doc_type text,
  doc_status text default 'not_submitted',
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
create policy "KYC: users read own" on public.kyc_verification for select using (auth.uid() = user_id);

-- =========================================================
-- 9. AUDIT LOG & FLAGS (Admin)
-- =========================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_game_id uuid references public.games(id) on delete set null,
  target_winner_id uuid references public.winners(id) on delete set null,
  action text not null,
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.audit_log enable row level security;
create policy "Audit log: admins read" on public.audit_log for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Audit log: admins insert" on public.audit_log for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid references auth.users(id) on delete cascade,
  target_game_id uuid references public.games(id) on delete set null,
  target_winner_id uuid references public.winners(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','investigating','cleared','confirmed','action_taken','closed')),
  reason text not null,
  severity text not null default 'medium',
  summary text,
  evidence jsonb,
  assigned_to uuid references auth.users(id) on delete set null,
  resolution text,
  action_taken text,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists flags_set_updated_at on public.flags;
create trigger flags_set_updated_at
before update on public.flags
for each row execute procedure public.set_updated_at();

alter table public.flags enable row level security;
create policy "Flags: admins access" on public.flags for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- =========================================================
-- 10. GAME LOGIC RPCs
-- =========================================================

-- Secure function called by Edge Function to finalize games
create or replace function public.process_game_completion(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game record;
  v_current_jackpot numeric;
begin
  select * into v_game from public.games where id = p_game_id;
  
  if v_game.status <> 'completed' then
    raise exception 'Game is not marked as completed';
  end if;

  -- Idempotency check
  if exists (select 1 from public.winners where game_id = p_game_id) then
    return; 
  end if;

  if v_game.tier in ('starter', 'world') then
    if v_game.result = 'win' then
      -- Win: Record winner, reset jackpot
      insert into public.winners (game_id, user_id, tier, amount, payout_type, status)
      values (v_game.id, v_game.user_id, v_game.tier, (select amount from public.jackpots where tier = v_game.tier), 'annuity', 'pending_verification');

      update public.jackpots set amount = 5.00, updated_at = now() where tier = v_game.tier;
      
    elsif v_game.result = 'loss' then
      -- Loss: Increment jackpot
      select amount into v_current_jackpot from public.jackpots where tier = v_game.tier;
      
      if v_game.tier = 'starter' then
        update public.jackpots set amount = least(coalesce(v_current_jackpot, 5.00) + 0.75, 1000), updated_at = now() where tier = 'starter';
      else
        update public.jackpots set amount = coalesce(v_current_jackpot, 5.00) + 1.00, updated_at = now() where tier = 'world';
      end if;
    end if;
  end if;
end;
$$;