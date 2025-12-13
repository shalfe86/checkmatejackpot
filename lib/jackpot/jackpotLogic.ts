import { supabase } from '../supabase';
import { JackpotInfo } from '../../types';

// Fallback config in case DB fetch fails or for initial render
const CONFIG = {
  starter: { base: 5.00, cap: 1000 },
  world: { base: 5.00 },
};

export const getJackpotInfo = async (): Promise<JackpotInfo> => {
  try {
    // Read directly from the global jackpots table
    const { data, error } = await supabase
      .from('jackpots')
      .select('tier, amount');

    if (error) throw error;

    let starterAmount = CONFIG.starter.base;
    let worldAmount = CONFIG.world.base;

    if (data) {
      const starterRow = data.find(r => r.tier === 'starter');
      const worldRow = data.find(r => r.tier === 'world');
      
      if (starterRow) starterAmount = Number(starterRow.amount);
      if (worldRow) worldAmount = Number(worldRow.amount);
    }

    return {
      starter: starterAmount,
      starterCap: CONFIG.starter.cap,
      world: worldAmount,
    };
  } catch (error) {
    console.error("Error fetching jackpot:", error);
    // Fallback if DB fails
    return { 
      starter: CONFIG.starter.base, 
      starterCap: CONFIG.starter.cap, 
      world: CONFIG.world.base 
    };
  }
};