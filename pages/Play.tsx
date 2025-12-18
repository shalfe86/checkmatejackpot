
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Timer } from '../components/Timer';
import { GameTier, JackpotInfo } from '../types';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';
import { formatCurrency } from '../lib/utils';
import { Trophy, Frown, RefreshCw, ShieldAlert, Coins, Lock, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const getTimeConfig = (tier: GameTier) => {
  switch (tier) {
    case GameTier.WORLD: return { initial: 25, increment: 1, max: 25 };
    case GameTier.STARTER: return { initial: 30, increment: 2, max: 35 };
    default: return { initial: 40, increment: 2, max: 50 };
  }
};

export const Play = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tier = (queryParams.get('tier') as GameTier) || GameTier.FREE;
  const timeConfig = getTimeConfig(tier);

  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState(new Chess());
  const [whiteTime, setWhiteTime] = useState(timeConfig.initial);
  const [blackTime, setBlackTime] = useState(timeConfig.initial);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [jackpots, setJackpots] = useState<JackpotInfo | null>(null);
  const [dimensions, setDimensions] = useState({ size: 480 });
  
  const boardRef = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);
  const gameRef = useRef(game);

  // Initial setup: Create game in DB or start local
  useEffect(() => {
    const init = async () => {
      if (tier === GameTier.FREE) return;
      
      const { data, error } = await supabase
        .from('games')
        .insert([{ 
          user_id: user?.id, 
          tier, 
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          status: 'active' 
        }])
        .select()
        .single();
      
      if (data) setGameId(data.id);
    };
    if (user && !gameId) init();
    getJackpotInfo().then(setJackpots);
  }, [user, tier, gameId]);

  // UI Adjustment
  useEffect(() => {
    const update = () => {
      if (boardRef.current) {
        const { width, height } = boardRef.current.getBoundingClientRect();
        setDimensions({ size: Math.min(width, height, 600) });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Chessground Controller
  useEffect(() => {
    if (boardRef.current && !api.current) {
      api.current = Chessground(boardRef.current, {
        fen: game.fen(),
        movable: {
          color: 'white',
          free: false,
          dests: new Map(),
          events: { after: (orig, dest) => handleMove(orig, dest) }
        },
        animation: { enabled: true, duration: 250 }
      });
    }
    if (api.current) {
      api.current.set({
        fen: game.fen(),
        turnColor: game.turn() === 'w' ? 'white' : 'black',
        movable: { 
          color: (isGameOver || isProcessing) ? undefined : 'white',
          dests: getDests(game)
        }
      });
    }
    gameRef.current = game;
  }, [game, isGameOver, isProcessing]);

  const getDests = (g: Chess) => {
    const dests = new Map();
    g.moves({ verbose: true }).forEach(m => {
      if (!dests.has(m.from)) dests.set(m.from, []);
      dests.get(m.from).push(m.to);
    });
    return dests;
  };

  const handleMove = async (from: string, to: string) => {
    if (isProcessing || isGameOver) return;
    
    setIsProcessing(true);
    const movePayload = { from, to, promotion: 'q' };

    // Optimistic local update
    const nextGame = new Chess(game.fen());
    nextGame.move(movePayload);
    setGame(nextGame);

    // authorative validation (Jackpot Tiers)
    if (tier !== GameTier.FREE && gameId) {
      try {
        const { data, error } = await supabase.functions.invoke('submit-move', {
          body: { game_id: gameId, move: movePayload }
        });

        if (error || data.error) throw new Error(data.error || "Server error");

        const updatedGame = new Chess(data.fen);
        setGame(updatedGame);
        if (data.isGameOver) {
          setIsGameOver(true);
          setGameResult(data.result);
        }
      } catch (e: any) {
        console.error("Referee Rejected Move:", e.message);
        // Rollback on mismatch
        setGame(new Chess(gameRef.current.fen()));
      }
    } else {
      // Local play logic for Free Tier
      // (Simplified: AI logic would still run locally for Free Tier here)
      setTimeout(() => setIsProcessing(false), 500);
    }
    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto h-[calc(100vh-80px)] p-4 flex flex-col md:flex-row gap-6 overflow-hidden">
      <div className="w-full md:w-80 space-y-4 shrink-0">
        <Card className="p-4 bg-card/80 border-primary/20">
          <div className="flex justify-between items-center mb-4">
             <Button variant="ghost" size="sm" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4 mr-1"/> Quit</Button>
             <Badge variant={tier === GameTier.WORLD ? 'gold' : 'secondary'} className="uppercase">{tier}</Badge>
          </div>
          
          <div className="space-y-4">
             <div className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-black border border-white/20"/>
                   <span className="text-sm font-medium">Referee Engine</span>
                </div>
                <Timer secondsRemaining={blackTime} isActive={game.turn() === 'b'} label="B" />
             </div>

             <div className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-white"/>
                   <span className="text-sm font-medium">You</span>
                </div>
                <Timer secondsRemaining={whiteTime} isActive={game.turn() === 'w'} label="W" />
             </div>
          </div>

          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-[10px] text-primary animate-pulse uppercase tracking-widest font-bold">
               <Loader2 className="w-3 h-3 animate-spin"/> Validating with Referee Node...
            </div>
          )}
        </Card>

        {jackpots && tier !== GameTier.FREE && (
          <Card className="p-4 bg-primary/5 border-primary/20">
             <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-widest">Current Jackpot</p>
             <p className="text-2xl font-black text-primary">{formatCurrency(tier === 'starter' ? jackpots.starter : jackpots.world)}</p>
          </Card>
        )}
        
        <div className="text-[10px] text-muted-foreground flex items-center gap-2 px-2">
           <ShieldCheck className="w-3 h-3 text-green-500" /> Server-side Move Verification Active
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center relative">
        <div ref={boardRef} className="bg-[#B58863] shadow-2xl rounded border-4 border-muted" style={{ width: dimensions.size, height: dimensions.size }} />
        
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
                   <h2 className="text-3xl font-black uppercase tracking-tight">{gameResult === 'win' ? 'Winner!' : 'Game Over'}</h2>
                   <p className="text-muted-foreground mt-2">
                      {gameResult === 'win' ? 'Your checkmate has been verified and recorded.' : 'Better luck next time.'}
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
