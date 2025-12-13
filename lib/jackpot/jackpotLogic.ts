import { JackpotInfo } from '../../types';

// Mock initial state
const initialJackpot: JackpotInfo = {
  starter: 1000,
  starterCap: 1000,
  world: 1543.25,
};

export const getJackpotInfo = (): JackpotInfo => {
  // In a real app, fetch from API
  return initialJackpot;
};

// Simulate jackpot growth
export const incrementWorldJackpot = (current: number) => {
  return current + 0.75;
};
