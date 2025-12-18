import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Chess } from "https://esm.sh/chess.js@1.0.0-beta.8";

// Add declaration for Deno to satisfy TypeScript in environments where Deno types are not globally defined
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- PIECE-SQUARE TABLES (PST) ---
const pawnPST = [[0,0,0,0,0,0,0,0],[5,10,10,-20,-20,10,10,5],[5,-5,-10,0,0,-10,-5,5],[0,0,0,20,20,0,0,0],[5,5,10,25,25,10,5,5],[10,10,20,30,30,20,10,10],[50,50,50,50,50,50,50,50],[0,0,0,0,0,0,0,0]];
const knightPST = [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,5,5,0,-20,-40],[-30,5,10,15,15,10,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,10,15,15,10,0,-30],[-40,-20,0,0,0,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]];
const bishopPST = [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,5,0,0,0,0,5,-10],[-10,10,10,10,10,10,10,-10],[-10,0,10,10,10,10,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,5,10,10,5,0,-10],[-10,0,0,0,0,0,0,-10],[-20,-10,-10,-10,-10,-10,-10,-20]];
const rookPST = [[0,0,0,5,5,0,0,0],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[5,10,10,10,10,10,10,5],[0,0,0,0,0,0,0,0]];
const queenPST = [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,5,0,0,0,0,-10],[-10,5,5,5,5,5,0,-10],[0,0,5,5,5,5,0,-5],[-5,0,5,5,5,5,0,-5],[-10,0,5,5,5,5,0,-10],[-10,0,0,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]];
const kingPST = [[20,30,10,0,0,10,30,20],[20,20,0,0,0,0,20,20],[-10,-20,-20,-20,-20,-20,-20,-10],[-20,-30,-30,-40,-40,-30,-30,-20],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30]];

const getPieceValue = (piece: any, x: number, y: number) => {
  if (!piece) return 0;
  const baseValues: any = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  let val = baseValues[piece.type] || 0;
  const table = { p: pawnPST, n: knightPST, b: bishopPST, r: rookPST, q: queenPST, k: kingPST }[piece.type as string] || [[]];
  if (piece.color === 'b') val += table[y][x];
  else val += table[7 - y][x];
  return piece.color === 'w' ? -val : val;
};

const evaluateBoard = (game: Chess) => {
  // Check for terminal states first to prioritize wins/draws correctly
  if (game.isCheckmate()) {
    // If it's black's turn and they are in checkmate, white won (bad for AI)
    return game.turn() === 'b' ? -1000000 : 1000000;
  }
  if (game.isDraw()) return 0;

  let totalEvaluation = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      totalEvaluation += getPieceValue(board[i][j], j, i);
    }
  }
  return totalEvaluation;
};

const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean, deadline: number): number => {
  // Check for terminal state or depth 0 or time limit exceeded
  if (depth === 0 || game.isGameOver() || Date.now() > deadline) {
    return evaluateBoard(game);
  }

  const moves = game.moves();
  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, false, deadline));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
      if (Date.now() > deadline) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, true, deadline));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
      if (Date.now() > deadline) break;
    }
    return best;
  }
};

/**
 * AI MOVE GENERATION with ITERATIVE DEEPENING and TIME LIMIT
 */
const getBestMoveTimeLimit = (game: Chess, timeLimitMs: number) => {
  const startTime = Date.now();
  const deadline = startTime + timeLimitMs;
  const moves = game.moves();
  
  if (moves.length === 0) return null;

  // Initialize with a random valid move just in case we time out immediately
  let bestMoveOverall = moves[Math.floor(Math.random() * moves.length)];
  let currentDepth = 1;

  // Iterative Deepening
  while (true) {
    if (Date.now() >= deadline) break;
    
    let bestValue = -Infinity;
    let depthBestMoves: string[] = [];
    let timedOut = false;

    // Sorting moves by evaluating them at depth 0 might improve alpha-beta pruning efficiency
    // but here we keep it simple and just iterate through the moves.
    for (const move of moves) {
      if (Date.now() >= deadline) {
        timedOut = true;
        break;
      }

      game.move(move);
      // We are finding best move for BLACK (the maximizing player in our evaluateBoard)
      const val = minimax(game, currentDepth - 1, -Infinity, Infinity, false, deadline);
      game.undo();

      if (val > bestValue) {
        bestValue = val;
        depthBestMoves = [move];
      } else if (val === bestValue) {
        depthBestMoves.push(move);
      }
    }

    if (!timedOut && depthBestMoves.length > 0) {
      // Pick one random move from the set of best-scoring moves at this depth
      bestMoveOverall = depthBestMoves[Math.floor(Math.random() * depthBestMoves.length)];
      currentDepth++;
      
      // Safety break: Don't exceed depth 6 as it becomes too slow even with iterative deepening
      if (currentDepth > 6) break;
    } else {
      break; // Stop if search at this depth timed out or failed
    }
  }

  return bestMoveOverall;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { game_id, move } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch current authoritative state
    const { data: dbGame, error: dbError } = await supabaseClient
      .from('games')
      .select('*')
      .eq('id', game_id)
      .single();

    if (dbError || !dbGame) throw new Error("Game not found");
    if (dbGame.status !== 'active') throw new Error("Game is not active");

    const chess = new Chess(dbGame.fen);
    
    // 2. Apply User Move
    try {
      const result = chess.move(move);
      if (!result) throw new Error("Invalid move");
    } catch (e) {
      throw new Error("Illegal move detected");
    }

    // 3. AI Move Generation (If not over)
    let aiMove = null;
    if (!chess.isGameOver()) {
      // Dynamic time limit based on tier
      const timeLimit = dbGame.tier === 'world' ? 2000 : dbGame.tier === 'starter' ? 1000 : 500;
      aiMove = getBestMoveTimeLimit(chess, timeLimit);
      if (aiMove) chess.move(aiMove);
    }

    // 4. Update Database
    const isGameOver = chess.isGameOver();
    let result = 'active';
    if (isGameOver) {
      if (chess.isCheckmate()) result = chess.turn() === 'b' ? 'win' : 'loss';
      else result = 'draw';
    }

    const { error: updateError } = await supabaseClient
      .from('games')
      .update({
        fen: chess.fen(),
        pgn: chess.pgn(),
        status: isGameOver ? 'completed' : 'active',
        result: result
      })
      .eq('id', game_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        fen: chess.fen(), 
        isGameOver, 
        result, 
        aiMove,
        pgn: chess.pgn()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});