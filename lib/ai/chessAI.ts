
import { Chess, Square } from 'chess.js';

/**
 * PIECE-SQUARE TABLES (PST)
 * Values for Black (AI). Positive is good for Black.
 * These encourage positional play: Knights in center, Kings safe, Pawns advancing.
 */

const pawnPST = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, -20, -20, 10, 10,  5],
    [5, -5, -10,  0,  0, -10, -5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const knightPST = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20,  0,  5,  5,  0, -20, -40],
    [-30,  5, 10, 15, 15, 10,  5, -30],
    [-30,  0, 15, 20, 20, 15,  0, -30],
    [-30,  5, 15, 20, 20, 15,  5, -30],
    [-30,  0, 10, 15, 15, 10,  0, -30],
    [-40, -20,  0,  0,  0,  0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
];

const bishopPST = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10,  5,  0,  0,  0,  0,  5, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10,  0, 10, 10, 10, 10,  0, -10],
    [-10,  5,  5, 10, 10,  5,  5, -10],
    [-10,  0,  5, 10, 10,  5,  0, -10],
    [-10,  0,  0,  0,  0,  0,  0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
];

const rookPST = [
    [0,  0,  0,  5,  5,  0,  0,  0],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const queenPST = [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10,  0,  5,  0,  0,  0,  0, -10],
    [-10,  5,  5,  5,  5,  5,  0, -10],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [-10,  0,  5,  5,  5,  5,  0, -10],
    [-10,  0,  0,  0,  0,  0,  0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
];

const kingPST = [
    [20, 30, 10,  0,  0, 10, 30, 20],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30]
];

const getPieceValue = (piece: any, x: number, y: number) => {
    if (!piece) return 0;
    
    const baseValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let val = baseValues[piece.type] || 0;

    // PST lookup (Black AI needs to flip the board/tables)
    const table: number[][] = {
        p: pawnPST, n: knightPST, b: bishopPST, r: rookPST, q: queenPST, k: kingPST
    }[piece.type as string] || [[]];

    // For simplicity, we use the table directly for Black (AI)
    // and mirrored for White (Human)
    if (piece.color === 'b') {
        val += table[y][x];
    } else {
        val += table[7 - y][x];
    }

    return piece.color === 'w' ? -val : val;
};

const evaluateBoard = (game: Chess) => {
    let totalEvaluation = 0;
    const board = game.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(board[i][j], j, i);
        }
    }
    return totalEvaluation;
};

/**
 * MINIMAX with ALPHA-BETA PRUNING
 */
const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
    if (depth === 0) return evaluateBoard(game);

    const moves = game.moves();
    if (isMaximizingPlayer) {
        let bestEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evaluation = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer);
            game.undo();
            bestEval = Math.max(bestEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return bestEval;
    } else {
        let bestEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evaluation = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer);
            game.undo();
            bestEval = Math.min(bestEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return bestEval;
    }
};

const getBestMoveAtDepth = (game: Chess, depth: number): string | null => {
    const moves = game.moves();
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestValue = -Infinity;

    // Randomize equal moves slightly to avoid repetitive games
    const sortedMoves = moves.sort(() => Math.random() - 0.5);

    for (const move of sortedMoves) {
        game.move(move);
        const boardValue = minimax(game, depth - 1, -Infinity, Infinity, false);
        game.undo();
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }

    return bestMove;
};

// FREE TIER: Depth 2 (Easy/Medium)
export const getFreeMove = (game: Chess): string | null => {
    return getBestMoveAtDepth(new Chess(game.fen()), 2);
};

// STARTER TIER: Depth 3 (Solid Club Player)
export const getStarterMove = (game: Chess): string | null => {
    return getBestMoveAtDepth(new Chess(game.fen()), 3);
};

// WORLD TIER: Depth 4 (Challenger/Master Level)
// This will take 1-3 seconds per move but will be nearly impossible for casuals to beat.
export const getWorldMove = (game: Chess): string | null => {
    return getBestMoveAtDepth(new Chess(game.fen()), 4);
};
