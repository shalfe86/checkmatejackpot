import { supabase } from '../supabase';
import { GameTier } from '../../types';

export const saveGameResult = async (
  userId: string,
  tier: GameTier,
  result: 'win' | 'loss' | 'draw',
  prize: number = 0
) => {
  try {
    // We use a Remote Procedure Call (RPC) to 'submit_game'.
    // This SQL function (defined in Supabase) handles:
    // 1. Inserting the game into the 'games' table
    // 2. Automatically updating the 'jackpots' table (reset on win, increment on loss)
    const { data, error } = await supabase.rpc('submit_game', {
      p_user_id: userId,
      p_tier: tier,
      p_result: result,
      p_prize: prize
    });

    if (error) throw error;
    console.log('Game processed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving game:', error);
    return null;
  }
};