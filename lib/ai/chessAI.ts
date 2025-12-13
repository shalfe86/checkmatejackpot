import { Chess } from 'chess.js';

// Basic material evaluation
// Enhanced to slightly value center control to make World tier less passive
const getEvaluation = (game: Chess) => {
  let score = 0;
  const board = game.board();
  
  for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
    for (let colIdx = 0; colIdx < 8; colIdx++) {
      const piece = board[rowIdx][colIdx];
      if (!piece) continue;
      
      let val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[piece.type] || 0;
      
      // Slight positional bias for World tier (center squares)
      if ((rowIdx === 3 || rowIdx === 4) && (colIdx === 3 || colIdx === 4)) {
        val += 0.2;
      }

      score += piece.color === 'w' ? val : -val;
    }
  }
  return score;
};

// FREE TIER: Very Easy
// Picks 2 random moves and plays the best one.
// Highly susceptible to blunders.
export const getFreeMove = (game: Chess): string | null => {
  const moves = game.moves();
  if (!moves || moves.length === 0) return null;
  
  let bestMove = moves[0];
  let bestScore = Infinity;

  // Only compare 2 random options
  for (let i = 0; i < 2; i++) {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const tempGame = new Chess(game.fen());
    try {
        tempGame.move(move);
        const score = getEvaluation(tempGame);
        // AI is Black, wants lowest score
        if (score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
    } catch (e) { continue; }
  }

  return bestMove;
};

// STARTER TIER: Medium
// Picks 6 random moves (or all if fewer than 6) and plays the best one.
// Misses complex tactics but captures hanging pieces more often.
export const getStarterMove = (game: Chess): string | null => {
  const moves = game.moves();
  if (!moves || moves.length === 0) return null;
  
  let bestMove = moves[0];
  let bestScore = Infinity;

  // Compare up to 6 random options
  const attempts = Math.min(moves.length, 6);

  for (let i = 0; i < attempts; i++) {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const tempGame = new Chess(game.fen());
    try {
        tempGame.move(move);
        const score = getEvaluation(tempGame);
        if (score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
    } catch (e) { continue; }
  }

  return bestMove;
};

// WORLD TIER: Hard
// Evaluates ALL legal moves.
// Plays the absolute best move by material/position score.
// Occasionally (15% chance) plays the 2nd best move to simulate human error.
export const getWorldMove = (game: Chess): string | null => {
  const moves = game.moves({ verbose: true });
  if (!moves || moves.length === 0) return null;

  let bestMoves: { move: string, score: number }[] = [];
  
  moves.forEach(move => {
      const tempGame = new Chess(game.fen());
      try {
        tempGame.move(move.san);
        const score = getEvaluation(tempGame);
        bestMoves.push({ move: move.san, score });
      } catch(e) {}
  });

  // Sort by score ascending (AI is Black, wants negative/low score)
  bestMoves.sort((a, b) => a.score - b.score);

  // Top 3 candidates
  const candidates = bestMoves.slice(0, 3);
  if (candidates.length === 0) return moves[0].san;
  
  // Weighted choice: 80% best move, 15% 2nd best, 5% 3rd best
  const rand = Math.random();
  if (rand < 0.8 || candidates.length < 2) return candidates[0].move;
  if (rand < 0.95 || candidates.length < 3) return candidates[1].move;
  return candidates[2].move;
};