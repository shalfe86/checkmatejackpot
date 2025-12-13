import { Chess, Move } from 'chess.js';

// Basic material evaluation
const getMaterialScore = (game: Chess) => {
  let score = 0;
  const board = game.board();
  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      const val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[piece.type] || 0;
      score += piece.color === 'w' ? val : -val;
    }
  }
  return score;
};

export const getStarterMove = (game: Chess): string | null => {
  const moves = game.moves();
  if (!moves || moves.length === 0) return null;
  
  // Pick 3 random moves and choose the best one for Black (lowest score)
  // This simulates "shallow" calculation
  let bestMove = moves[0];
  let bestScore = Infinity;

  // Try up to 3 random candidates
  for (let i = 0; i < 3; i++) {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const tempGame = new Chess(game.fen());
    try {
        tempGame.move(move);
        const score = getMaterialScore(tempGame);
        if (score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
    } catch (e) { continue; }
  }

  return bestMove;
};

export const getWorldMove = (game: Chess): string | null => {
  const moves = game.moves({ verbose: true });
  if (!moves || moves.length === 0) return null;

  // Evaluate all moves
  let bestMoves: { move: string, score: number }[] = [];
  
  moves.forEach(move => {
      const tempGame = new Chess(game.fen());
      try {
        tempGame.move(move.san);
        const score = getMaterialScore(tempGame);
        bestMoves.push({ move: move.san, score });
      } catch(e) {}
  });

  // Sort by score (ascending for Black)
  bestMoves.sort((a, b) => a.score - b.score);

  // Take top 3 best moves and pick random to simulate "slight randomization"
  const topCandidates = bestMoves.slice(0, 3);
  if (topCandidates.length === 0) return moves[0].san;
  
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  return selected.move;
};
