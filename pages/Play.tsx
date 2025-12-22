import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Timer } from '../components/Timer';
import { GameTier, JackpotInfo } from '../types';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';
import { getFreeMove, getStarterMove, getWorldMove } from '../lib/ai/chessAI';
import { formatCurrency } from '../lib/utils';
import { Trophy, Frown, RefreshCw, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const getTimeConfig = (tier: GameTier) => {
  switch (tier) {
    case GameTier.WORLD: return { initial: 25, increment: 1, max: 25 };
    case GameTier.STARTER: return { initial: 30, increment: 2, max: 35 };
    default: return { initial: 40, increment: 2, max: 50 };
  }
};

export const Play = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const tier = (queryParams.get('tier') as GameTier) || GameTier.FREE;
  const timeConfig = getTimeConfig(tier);

  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState(() => new Chess(START_FEN));

  const [whiteTime, setWhiteTime] = useState(timeConfig.initial);
  const [blackTime, setBlackTime] = useState(timeConfig.initial);

  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Timer should not start until after first successful move
  const [hasStarted, setHasStarted] = useState(false);

  // Clock override for paid tiers while the server is thinking / applying AI
  const [clockTurnOverride, setClockTurnOverride] = useState<'w' | 'b' | null>(null);
  const activeTurn = clockTurnOverride ?? game.turn(); // 'w' | 'b'

  const [jackpots, setJackpots] = useState<JackpotInfo | null>(null);
  const [dimensions, setDimensions] = useState({ size: 480 });

  const boardRef = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);

  // Keep latest chess state in a ref (avoid stale closures)
  const gameRef = useRef<Chess>(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  // Helper: legal destinations map for chessground
  const getDests = useCallback((g: Chess) => {
    const dests = new Map<string, string[]>();
    (g.moves({ verbose: true }) as any[]).forEach((m) => {
      if (!dests.has(m.from)) dests.set(m.from, []);
      dests.get(m.from)!.push(m.to);
    });
    return dests;
  }, []);

  // Create a DB game for non-free tiers
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      if (tier === GameTier.FREE) return;
      if (gameId) return;

      const { data, error } = await supabase
        .from('games')
        .insert([{
          user_id: user.id,
          tier,
          fen: START_FEN,
          status: 'active',
          result: 'active',
        }])
        .select()
        .single();

      if (error) {
        console.error('Failed to create game:', error);
        return;
      }

      if (data?.id) setGameId(data.id);
    };

    init();
    getJackpotInfo().then(setJackpots).catch(console.error);
  }, [user, tier, gameId]);

  // Resize board
  useEffect(() => {
    const update = () => {
      if (!boardRef.current) return;
      const { width, height } = boardRef.current.getBoundingClientRect();
      setDimensions({ size: Math.min(width, height, 600) });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ✅ CLOCK ENGINE (ticks once per second) — starts only after first move
  useEffect(() => {
    if (!hasStarted) return;
    if (isGameOver) return;

    const interval = window.setInterval(() => {
      if (activeTurn === 'w') {
        setWhiteTime(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setIsGameOver(true);
            setGameResult('loss'); // user flags
          }
          return next;
        });
      } else {
        setBlackTime(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setIsGameOver(true);
            setGameResult('win'); // AI flags
          }
          return next;
        });
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeTurn, hasStarted, isGameOver]);

  // Handle a user move
  const handleMove = useCallback(async (from: string, to: string) => {
    if (isProcessing || isGameOver) return;

    const current = gameRef.current;

    // User is always White
    if (current.turn() !== 'w') return;

    setIsProcessing(true);

    try {
      const movePayload = { from, to, promotion: 'q' as const };

      // Validate legality based on CURRENT board
      const legalMoves = current.moves({ verbose: true }) as any[];
      const isLegal = legalMoves.some(m => m.from === from && m.to === to);
      if (!isLegal) {
        console.warn('Attempted illegal move (client-side)', { movePayload, fen: current.fen() });
        api.current?.set({ fen: current.fen(), movable: { dests: getDests(current) } });
        return;
      }

      // Start the clock only after first successful move attempt
      if (!hasStarted) setHasStarted(true);

      // --- SERVER-AUTHORITATIVE for paid tiers ---
      if (tier !== GameTier.FREE && gameId) {
        // White moved: apply increment immediately and switch clock to Black while server/AI runs
        setWhiteTime(prev => Math.min(timeConfig.max, prev + timeConfig.increment));
        setClockTurnOverride('b');

        const { data, error } = await supabase.functions.invoke('submit-move', {
          body: { game_id: gameId, move: movePayload },
        });

        if (error) {
          console.error('Referee invoke error:', error);
          setClockTurnOverride(null);
          api.current?.set({ fen: current.fen(), movable: { dests: getDests(current) } });
          return;
        }

        if (!data || data.error) {
          console.error('Referee rejected move:', data?.error);
          setClockTurnOverride(null);
          api.current?.set({ fen: current.fen(), movable: { dests: getDests(current) } });
          return;
        }

        const updated = new Chess(data.fen);
        setGame(updated);

        // AI moved on server: apply black increment once and return to actual turn
        setBlackTime(prev => Math.min(timeConfig.max, prev + timeConfig.increment));
        setClockTurnOverride(null);

        if (data.isGameOver) {
          setIsGameOver(true);
          setGameResult(data.result);
        }

        return;
      }

      // --- FREE tier: local move + local AI ---
      const nextGame = new Chess(current.fen());
      const applied = nextGame.move(movePayload as any);
      if (!applied) {
        console.warn('Chess.js rejected move (free tier)', movePayload);
        api.current?.set({ fen: current.fen(), movable: { dests: getDests(current) } });
        return;
      }

      // White moved: apply increment
      setWhiteTime(prev => Math.min(timeConfig.max, prev + timeConfig.increment));
      setGame(nextGame);

      // End check after user's move
      if (nextGame.isGameOver()) {
        setIsGameOver(true);
        if (nextGame.isCheckmate()) {
          setGameResult(nextGame.turn() === 'w' ? 'loss' : 'win');
        } else {
          setGameResult('draw');
        }
        return;
      }

      // Local AI reply
      const aiGame = new Chess(nextGame.fen());
      let aiMove: string | null = null;
      if (tier === GameTier.FREE) aiMove = getFreeMove(aiGame);
      else if (tier === GameTier.STARTER) aiMove = getStarterMove(aiGame);
      else if (tier === GameTier.WORLD) aiMove = getWorldMove(aiGame);

      if (aiMove) {
        await new Promise(r => setTimeout(r, 300));
        aiGame.move(aiMove as any);

        // Black moved: apply increment
        setBlackTime(prev => Math.min(timeConfig.max, prev + timeConfig.increment));
        setGame(aiGame);

        if (aiGame.isGameOver()) {
          setIsGameOver(true);
          if (aiGame.isCheckmate()) {
            setGameResult(aiGame.turn() === 'w' ? 'loss' : 'win');
          } else {
            setGameResult('draw');
          }
        }
      }

    } catch (e: any) {
      console.error('handleMove exception:', e?.message || e);
      setClockTurnOverride(null);
      const cur = gameRef.current;
      api.current?.set({ fen: cur.fen(), movable: { dests: getDests(cur) } });
    } finally {
      setIsProcessing(false);
      // safety: never leave clock stuck on override
      setClockTurnOverride(null);
    }
  }, [gameId, getDests, hasStarted, isGameOver, isProcessing, tier, timeConfig.increment, timeConfig.max]);

  // ✅ Fix “stops letting me move” by using a stable ref for the after handler
  const handleMoveRef = useRef(handleMove);
  useEffect(() => {
    handleMoveRef.current = handleMove;
  }, [handleMove]);

  // Chessground init + updates
  useEffect(() => {
    const g = game;

    // Use activeTurn so we disable dragging while server is processing Black
    const isUsersTurnNow = (activeTurn === 'w');
    const canMove = !isGameOver && !isProcessing && isUsersTurnNow;

    if (boardRef.current && !api.current) {
      api.current = Chessground(boardRef.current, {
        fen: g.fen(),
        movable: {
          color: 'white',
          free: false,
          dests: canMove ? getDests(g) : new Map(),
          events: {
            after: (orig: string, dest: string) => handleMoveRef.current(orig, dest),
          },
        },
        animation: { enabled: true, duration: 250 },
      });
    }

    if (api.current) {
      api.current.set({
        fen: g.fen(),
        turnColor: (activeTurn === 'w') ? 'white' : 'black',
        movable: {
          color: canMove ? 'white' : undefined,
          dests: canMove ? getDests(g) : new Map(),
        },
      });
    }
  }, [game, activeTurn, getDests, isGameOver, isProcessing]);

  return (
    <div className="container mx-auto h-[calc(100vh-80px)] p-4 flex flex-col md:flex-row gap-6 overflow-hidden">
      <div className="w-full md:w-80 space-y-4 shrink-0">
        <Card className="p-4 bg-card/80 border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Quit
            </Button>
            <Badge variant={tier === GameTier.WORLD ? 'gold' : 'secondary'} className="uppercase">
              {tier}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-black border border-white/20" />
                <span className="text-sm font-medium">Referee Engine</span>
              </div>
              <Timer secondsRemaining={blackTime} isActive={hasStarted && activeTurn === 'b'} label="B" />
            </div>

            <div className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white" />
                <span className="text-sm font-medium">You</span>
              </div>
              <Timer secondsRemaining={whiteTime} isActive={hasStarted && activeTurn === 'w'} label="W" />
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-[10px] text-primary animate-pulse uppercase tracking-widest font-bold">
              <Loader2 className="w-3 h-3 animate-spin" /> Validating with Referee Node...
            </div>
          )}
        </Card>

        {jackpots && tier !== GameTier.FREE && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-widest">Current Jackpot</p>
            <p className="text-2xl font-black text-primary">
              {formatCurrency(tier === 'starter' ? jackpots.starter : jackpots.world)}
            </p>
          </Card>
        )}

        <div className="text-[10px] text-muted-foreground flex items-center gap-2 px-2">
          <ShieldCheck className="w-3 h-3 text-green-500" /> Server-side Move Verification Active
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center relative">
        <div
          ref={boardRef}
          className="bg-[#B58863] shadow-2xl rounded border-4 border-muted"
          style={{ width: dimensions.size, height: dimensions.size }}
        />

        {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <Card className="max-w-sm w-full p-8 text-center space-y-6">
              {gameResult === 'win' ? (
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary animate-bounce">
                  <Trophy className="w-8 h-8" />
                </div>
              ) : (
                <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center text-destructive">
                  <Frown className="w-8 h-8" />
                </div>
              )}

              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">
                  {gameResult === 'win' ? 'Winner!' : 'Game Over'}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {gameResult === 'win'
                    ? 'Your checkmate has been verified and recorded.'
                    : 'Better luck next time.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="outline" onClick={() => navigate('/')}>Home</Button>
                <Button onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Rematch
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
