/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";
import { Chess } from "https://esm.sh/chess.js@1.0.0-beta.8?target=deno";



// --- PIECE-SQUARE TABLES (PST) for AI ---
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
  if (game.isCheckmate()) return game.turn() === 'b' ? -1000000 : 1000000;
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
  if (depth === 0 || game.isGameOver() || Date.now() > deadline) return evaluateBoard(game);
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

const getBestMoveTimeLimit = (game: Chess, timeLimitMs: number) => {
  const startTime = Date.now();
  const deadline = startTime + timeLimitMs;
  const moves = game.moves();
  if (moves.length === 0) return null;

  let bestMoveOverall = moves[Math.floor(Math.random() * moves.length)];
  let currentDepth = 1;

  while (true) {
    if (Date.now() >= deadline) break;
    let bestValue = -Infinity;
    let depthBestMoves: string[] = [];
    let timedOut = false;

    for (const move of moves) {
      if (Date.now() >= deadline) { timedOut = true; break; }
      game.move(move);
      const val = minimax(game, currentDepth - 1, -Infinity, Infinity, false, deadline);
      game.undo();
      if (val > bestValue) { bestValue = val; depthBestMoves = [move]; }
      else if (val === bestValue) { depthBestMoves.push(move); }
    }

    if (!timedOut && depthBestMoves.length > 0) {
      bestMoveOverall = depthBestMoves[Math.floor(Math.random() * depthBestMoves.length)];
      currentDepth++;
      if (currentDepth > 6) break;
    } else {
      break;
    }
  }
  return bestMoveOverall;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { game_id, move } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    );

    // 1. Fetch current game state
    const { data: dbGame, error: dbError } = await supabaseClient
      .from('games')
      .select('*')
      .eq('id', game_id)
      .single();

    if (dbError || !dbGame) throw new Error("Game not found");
    if (dbGame.status !== 'active') throw new Error("Game is not active");

    const chess = new Chess(dbGame.fen);
    const movesToInsert: any[] = [];

    // 2. Validate & Apply User Move
    let userMoveObj;
    try {
      const fenBefore = chess.fen();
      userMoveObj = chess.move(move); // Returns { color: 'w', from: 'e2', to: 'e4', san: 'e4', ... }
      if (!userMoveObj) throw new Error("Invalid move");
      
      movesToInsert.push({
        game_id: game_id,
        ply: chess.history().length, // 1-based ply count
        player: 'user',
        san: userMoveObj.san,
        from_sq: userMoveObj.from,
        to_sq: userMoveObj.to,
        fen_before: fenBefore,
        fen_after: chess.fen()
      });
    } catch (e) {
      throw new Error("Illegal move detected");
    }

    // 3. AI Turn (if game continues)
    let aiMoveSan = null;
    if (!chess.isGameOver()) {
      const timeLimit = dbGame.tier === 'world' ? 2000 : dbGame.tier === 'starter' ? 1000 : 500;
      aiMoveSan = getBestMoveTimeLimit(chess, timeLimit);
      
      if (aiMoveSan) {
        const fenBeforeAI = chess.fen();
        const aiMoveObj = chess.move(aiMoveSan);
        
        movesToInsert.push({
          game_id: game_id,
          ply: chess.history().length,
          player: 'ai',
          san: aiMoveObj.san,
          from_sq: aiMoveObj.from,
          to_sq: aiMoveObj.to,
          fen_before: fenBeforeAI,
          fen_after: chess.fen()
        });
      }
    }

    // 4. Update Game State
    const isGameOver = chess.isGameOver();
    let result = 'active';
    if (isGameOver) {
      if (chess.isCheckmate()) {
        // If it's White's turn now, White lost. If Black's turn, Black lost (User won).
        // Since AI moves immediately, if it's checkmate, the last mover won.
        result = chess.turn() === 'w' ? 'loss' : 'win'; 
      } else {
        result = 'draw';
      }
    }

    // 5. Batch Database Updates (Moves + Game State)
    if (movesToInsert.length > 0) {
      const { error: movesError } = await supabaseClient
        .from('moves')
        .insert(movesToInsert);
      if (movesError) console.error("Error saving moves:", movesError);
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

    // 6. Secure Payout Trigger
    if (isGameOver) {
      await supabaseClient.rpc('process_game_completion', { p_game_id: game_id });
    }

    return new Response(
      JSON.stringify({ 
        fen: chess.fen(), 
        isGameOver, 
        result, 
        aiMove: aiMoveSan, 
        pgn: chess.pgn() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Game error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});