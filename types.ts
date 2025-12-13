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
