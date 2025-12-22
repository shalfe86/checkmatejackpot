/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Chess } from "npm:chess.js@1.0.0-beta.8";

// --- PIECE-SQUARE TABLES (PST) for AI ---
const pawnPST = [[0,0,0,0,0,0,0,0],[5,10,10,-20,-20,10,10,5],[5,-5,-10,0,0,-10,-5,5],[0,0,0,20,20,0,0,0],[5,5,10,25,25,10,5,5],[10,10,20,30,30,20,10,10],[50,50,50,50,50,50,50,50],[0,0,0,0,0,0,0,0]];
const knightPST = [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,5,5,0,-20,-40],[-30,5,10,15,15,10,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,10,15,15,10,0,-30],[-40,-20,0,0,0,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]];
const bishopPST = [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,5,0,0,0,0,5,-10],[-10,10,10,10,10,10,10,-10],[-10,0,10,10,10,10,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,5,10,10,5,0,-10],[-10,0,0,0,0,0,0,-10],[-20,-10,-10,-10,-10,-10,-10,-20]];
const rookPST = [[0,0,0,5,5,0,0,0],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[5,10,10,10,10,10,10,5],[0,0,0,0,0,0,0,0]];
const queenPST = [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,5,0,0,0,0,-10],[-10,5,5,5,5,5,0,-10],[0,0,5,5,5,5,0,-5],[-5,0,5,5,5,5,0,-5],[-10,0,5,5,5,5,0,-10],[-10,0,0,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]];
const kingPST = [[20,30,10,0,0,10,30,20],[20,20,0,0,0,0,20,20],[-10,-20,-20,-20,-20,-20,-20,-10],[-20,-30,-30,-40,-40,-30,-30,-20],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30]];

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type IncomingMove =
  | string
  | {
      from: string;
      to: string;
      promotion?: string;
    };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getPieceValue = (piece: any, x: number, y: number) => {
  if (!piece) return 0;
  const baseValues: any = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  let val = baseValues[piece.type] || 0;
  const table =
    ({ p: pawnPST, n: knightPST, b: bishopPST, r: rookPST, q: queenPST, k: kingPST } as any)[piece.type] || [[]];

  if (piece.color === "b") val += table[y][x];
  else val += table[7 - y][x];
  return piece.color === "w" ? -val : val;
};

const evaluateBoard = (game: Chess) => {
  if (game.isCheckmate()) return game.turn() === "b" ? -1_000_000 : 1_000_000;
  if (game.isDraw()) return 0;

  let total = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) total += getPieceValue(board[i][j], j, i);
  }
  return total;
};

const minimax = (
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  deadline: number
): number => {
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
  const deadline = Date.now() + timeLimitMs;
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
      if (Date.now() >= deadline) {
        timedOut = true;
        break;
      }

      game.move(move);
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
      bestMoveOverall = depthBestMoves[Math.floor(Math.random() * depthBestMoves.length)];
      currentDepth++;
      if (currentDepth > 6) break;
    } else {
      break;
    }
  }

  return bestMoveOverall;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    // --- Parse input safely ---
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const game_id: string | undefined = payload?.game_id;
    const move: IncomingMove | undefined = payload?.move;

    if (!game_id || typeof game_id !== "string") {
      return json({ ok: false, error: "Missing or invalid game_id" }, 400);
    }
    if (!move || (typeof move !== "string" && (typeof move !== "object" || !("from" in move) || !("to" in move)))) {
      return json({ ok: false, error: "Missing or invalid move" }, 400);
    }

    // --- Env var guard (critical) ---
    const supabaseUrl = Deno.env.get("REFEREE_SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("REFEREE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing env vars", { hasUrl: !!supabaseUrl, hasKey: !!serviceKey });
      return json({ ok: false, error: "Server misconfigured: missing referee env vars" }, 500);
    }

    const supabaseClient = createClient(supabaseUrl, serviceKey);

    // 1) Fetch current game state
    const { data: dbGame, error: dbError } = await supabaseClient
      .from("games")
      .select("*")
      .eq("id", game_id)
      .single();

    if (dbError || !dbGame) return json({ ok: false, error: "Game not found" }, 400);
    if (dbGame.status !== "active") return json({ ok: false, error: "Game is not active" }, 400);

    // 2) Validate & apply user move (server authoritative)
    const chess = new Chess(dbGame.fen);
    const movesToInsert: any[] = [];

    const fenBeforeUser = chess.fen();
    const userMoveObj = chess.move(move as any);
    if (!userMoveObj) return json({ ok: false, error: "Illegal move detected" }, 400);

    movesToInsert.push({
      game_id,
      ply: chess.history().length,
      player: "user",
      san: userMoveObj.san,
      from_sq: userMoveObj.from,
      to_sq: userMoveObj.to,
      fen_before: fenBeforeUser,
      fen_after: chess.fen(),
    });

    // 3) AI move (if game continues)
    let aiMoveSan: string | null = null;
    if (!chess.isGameOver()) {
      const timeLimit =
        dbGame.tier === "world" ? 2000 : dbGame.tier === "starter" ? 1000 : 500;

      aiMoveSan = getBestMoveTimeLimit(chess, timeLimit);

      if (aiMoveSan) {
        const fenBeforeAI = chess.fen();
        const aiMoveObj = chess.move(aiMoveSan);

        if (aiMoveObj) {
          movesToInsert.push({
            game_id,
            ply: chess.history().length,
            player: "ai",
            san: aiMoveObj.san,
            from_sq: aiMoveObj.from,
            to_sq: aiMoveObj.to,
            fen_before: fenBeforeAI,
            fen_after: chess.fen(),
          });
        }
      }
    }

    // 4) Determine result
    const isGameOver = chess.isGameOver();
    let result: "active" | "win" | "loss" | "draw" = "active";

    if (isGameOver) {
      if (chess.isCheckmate()) {
        // If it's White's turn now, White is the side that is checkmated.
        // User is White in your UI, so if turn() === 'w' then user lost.
        result = chess.turn() === "w" ? "loss" : "win";
      } else {
        result = "draw";
      }
    }

    // 5) Persist move history
    if (movesToInsert.length > 0) {
      const { error: movesError } = await supabaseClient.from("moves").insert(movesToInsert);
      if (movesError) {
        console.error("Error saving moves:", movesError);
        return json({ ok: false, error: "Failed to save moves" }, 500);
      }
    }

    // 6) Persist game state
    const { error: updateError } = await supabaseClient
      .from("games")
      .update({
        fen: chess.fen(),
        pgn: chess.pgn(),
        status: isGameOver ? "completed" : "active",
        result,
      })
      .eq("id", game_id);

    if (updateError) {
      console.error("Error updating game:", updateError);
      return json({ ok: false, error: "Failed to update game" }, 500);
    }

    // 7) Payout trigger (only if game over)
    if (isGameOver) {
      const { error: rpcError } = await supabaseClient.rpc("process_game_completion", {
        p_game_id: game_id,
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        // Don't fail the move because payouts can be retried; return success.
      }
    }

    return json({
      ok: true,
      fen: chess.fen(),
      isGameOver,
      result,
      aiMove: aiMoveSan,
      pgn: chess.pgn(),
    });
  } catch (error: any) {
    console.error("Game error:", error);
    return json({ ok: false, error: error?.message ?? "Unknown error" }, 500);
  }
});
