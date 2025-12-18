
import { supabase } from '../supabase';
import { GameTier } from '../../types';

export const saveGameResult = async (
  userId: string,
  tier: GameTier,
  result: 'win' | 'loss' | 'draw',
  prize: number = 0,
  pgn: string = ''
) => {
  try {
    // We pass the full PGN to the database. 
    // The 'submit_game' RPC should verify the PGN against a chess engine in a real production env.
    const { data, error } = await supabase.rpc('submit_game', {
      p_user_id: userId,
      p_tier: tier,
      p_result: result,
      p_prize: prize,
      p_pgn: pgn 
    });

    if (error) throw error;
    console.log('Game processed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving game:', error);
    return null;
  }
};
