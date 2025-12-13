
export enum GameTier {
  FREE = 'free',
  STARTER = 'starter',
  WORLD = 'world',
}

export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  monthlyWins: number; // For Starter tier eligibility
  role?: 'user' | 'admin';
}

export interface GameResult {
  id: string;
  date: string;
  tier: GameTier;
  result: 'win' | 'loss' | 'draw';
  prize?: number;
}

export interface JackpotInfo {
  starter: number;
  starterCap: number;
  world: number;
}

export type PayoutStatus = 'pending_review' | 'kyc_required' | 'scheduled' | 'paid' | 'flagged' | 'voided';
export type PayoutType = 'lump_sum' | 'annuity';

export interface Winner {
  id: string;
  user_id: string;
  game_id: string;
  tier: GameTier;
  amount: number;
  status: PayoutStatus;
  payout_type: PayoutType;
  full_name?: string;
  email?: string; // Joined from profiles
  username?: string; // Joined from profiles
  country?: string;
  created_at: string;
  notes?: string;
  kyc_status?: 'pending' | 'verified' | 'rejected';
}

export interface PayoutScheduleItem {
  id?: string;
  winner_id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'sent' | 'completed';
  installment_number: number;
  total_installments: number;
}