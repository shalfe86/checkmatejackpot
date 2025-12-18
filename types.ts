
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
  monthlyWins: number;
  role?: 'user' | 'admin';
}

export interface GameResult {
  id: string;
  date: string;
  tier: GameTier;
  result: 'win' | 'loss' | 'draw';
  prize?: number;
  pgn: string; // Added for server-side move validation
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
  email?: string;
  username?: string;
  country?: string;
  created_at: string;
  notes?: string;
  kyc_status?: 'pending' | 'verified' | 'rejected';
  pgn?: string; // Move history stored for audit
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

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'game_entry' | 'payout' | 'admin_adjustment' | 'refund';
  description?: string;
  created_at: string;
  game_id?: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_id?: string;
  target_table?: string;
  details?: any;
  created_at: string;
  admin_email?: string;
}

export interface GameFlag {
  id: string;
  game_id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}
