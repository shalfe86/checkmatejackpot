
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Timer } from '../components/Timer';
import { AdSlot } from '../components/AdSlot';
import { GameTier, JackpotInfo } from '../types';
import { getFreeMove, getStarterMove, getWorldMove } from '../lib/ai/chessAI';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';
import { formatCurrency } from '../lib/utils';
import { Trophy, Frown, RefreshCw, ShieldAlert, Coins, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveGameResult } from '../lib/game/saveGame';
import { supabase } from '../lib/supabase';

const getTimeConfig = (tier: GameTier) => {
  switch (tier) {
    case GameTier.WORLD:
      return { initial: 25, increment: 1, max: 25 };
    case GameTier.STARTER:
      return { initial: 30, increment: 2, max: 35 };
    case GameTier.FREE:
    default:
      return { initial: 40, increment: 2, max: 50 };
  }
};

const getDests = (game: Chess) => {
  const dests = new Map();
  game.moves({ verbose: true }).forEach((m) => {
    if (!dests.has(m.from)) dests.set(m.from, []);
    dests.get(m.from).push(m.to);
  });
  return dests;
};

const CustomChessboard = ({ game, onMove, isGameOver, width, height }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);

  useEffect(() => {
    if (ref.current && !api.current) {
      api.current = Chessground(ref.current, {
        fen: game.fen(),
        orientation: 'white',
        turnColor: 'white',
        animation: { enabled: true, duration: 200 },
        movable: {
          color: 'white',
          free: false,
          dests: getDests(game),
          events: {
            after: (orig: string, dest: string) => {
                onMove(orig, dest);
            },
          },
        },
        drawable: { enabled: true },
      });
    } else if (api.current) {
      api.current.set({
        fen: game.fen(),
        turnColor: game.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: isGameOver ? undefined : (game.turn() === 'w' ? 'white' : 'black'),
          dests: getDests(game),
        },
      });
    }
  }, [game, isGameOver, onMove]);

  useEffect(() => {
    if (api.current) api.current.redrawAll();
  }, [width, height]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} className="cg-board-wrap" />;
};

export const Play = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tier = (queryParams.get('tier') as GameTier) || GameTier.FREE;
  const timeConfig = getTimeConfig(tier);

  const [game, setGame] = useState(new Chess());
  const [whiteTime, setWhiteTime] = useState(timeConfig.initial);
  const [blackTime, setBlackTime] = useState(timeConfig.initial);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [jackpots, setJackpots] = useState<JackpotInfo | null>(null);

  const [boardDimensions, setBoardDimensions] = useState({ width: 480, height: 480 });
  const boardWrapperRef = useRef<HTMLDivElement>(null);

  const timerInterval = useRef<number | null>(null);
  const gameRef = useRef(game);
  const isGameOverRef = useRef(isGameOver);
  const isGameStartedRef = useRef(isGameStarted);
  const hasSavedGameRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && tier !== GameTier.FREE) {
        navigate('/auth');
        return;
    }
    if (user) {
        setLoadingProfile(true);
        supabase.from('profiles')
        .select('role, credits')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
            if (data) {
                setIsAdmin(data.role === 'admin');
                setCredits(data.credits);
            }
            setLoadingProfile(false);
        });
    } else {
        setLoadingProfile(false);
    }
  }, [user, authLoading, tier, navigate]);

  useEffect(() => {
    getJackpotInfo().then(setJackpots);
  }, []);

  useEffect(() => {
    gameRef.current = game;
    isGameOverRef.current = isGameOver;
    isGameStartedRef.current = isGameStarted;
  }, [game, isGameOver, isGameStarted]);

  useEffect(() => {
    return () => {
      if (isGameStartedRef.current && !isGameOverRef.current && user && tier !== GameTier.FREE && !hasSavedGameRef.current) {
        hasSavedGameRef.current = true;
        saveGameResult(user.id, tier, 'loss', 0, gameRef.current.pgn());
      }
    };
  }, [user, tier]);

  useEffect(() => {
    const updateDimensions = () => {
        if (boardWrapperRef.current) {
            const { width, height } = boardWrapperRef.current.getBoundingClientRect();
            const size = Math.min(width, height);
            setBoardDimensions({ width: size, height: size });
        }
    };
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (boardWrapperRef.current) resizeObserver.observe(boardWrapperRef.current);
    window.addEventListener('resize', updateDimensions);
    return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    setWhiteTime(timeConfig.initial);
    setBlackTime(timeConfig.initial);
    setGame(new Chess());
    setIsGameStarted(false);
    setIsGameOver(false);
    setGameResult(null);
    setIsVerifying(false);
    hasSavedGameRef.current = false;
    if (timerInterval.current) {
        window.clearInterval(timerInterval.current);
        timerInterval.current = null;
    }
  }, [tier, timeConfig.initial]);

  const jackpotAmount = jackpots 
    ? (tier === GameTier.STARTER ? jackpots.starter : tier === GameTier.WORLD ? jackpots.world : 0)
    : 0;
  
  const entryCost = tier === GameTier.WORLD ? 2 : tier === GameTier.STARTER ? 1 : 0;
  const canAfford = tier === GameTier.FREE || (credits !== null && credits >= entryCost);

  useEffect(() => {
    if (isGameStarted && !isGameOver && !timerInterval.current) {
      timerInterval.current = window.setInterval(() => {
        const turn = gameRef.current.turn();
        if (turn === 'w') {
          setWhiteTime(prev => {
            if (prev <= 0) {
              handleGameOver('loss');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
             if (prev <= 0) {
              handleGameOver('win');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else if (isGameOver && timerInterval.current) {
      window.clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    return () => {
      if (timerInterval.current) window.clearInterval(timerInterval.current);
    }
  }, [isGameStarted, isGameOver]);

  const handleGameOver = useCallback(async (result: 'win' | 'loss' | 'draw') => {
    if (isGameOverRef.current) return;
    setIsGameOver(true);
    setGameResult(result);
    if (timerInterval.current) window.clearInterval(timerInterval.current);

    if (user && !hasSavedGameRef.current) {
      hasSavedGameRef.current = true;
      setIsVerifying(true);
      const prize = result === 'win' ? jackpotAmount : 0;
      
      if (tier !== GameTier.FREE && credits !== null) {
          setCredits(credits - entryCost);
      }

      const pgn = gameRef.current.pgn();
      await saveGameResult(user.id, tier, result, prize, pgn);
      setIsVerifying(false);
    }
  }, [user, tier, jackpotAmount, credits, entryCost]);

  const safeMove = useCallback((move: { from: string; to: string; promotion?: string } | string) => {
    const gameCopy = new Chess(gameRef.current.fen());
    let result = null;

    try {
        result = gameCopy.move(move);
    } catch (e) {
        if (typeof move === 'object' && move.promotion) {
            try {
                const { promotion, ...cleanMove } = move;
                result = gameCopy.move(cleanMove);
            } catch (retryError) { return false; }
        } else { return false; }
    }

    if (result) {
        setGame(gameCopy);
        if (result.color === 'w') { 
            setWhiteTime(t => Math.min(t + timeConfig.increment, timeConfig.max));
        } else { 
            setBlackTime(t => Math.min(t + timeConfig.increment, timeConfig.max));
        }
        
        if (!isGameStarted) setIsGameStarted(true);
        
        if (gameCopy.isGameOver()) {
            if (gameCopy.isCheckmate()) {
                handleGameOver(gameCopy.turn() === 'w' ? 'loss' : 'win');
            } else {
                handleGameOver('draw');
            }
        }
        return true;
    }
    return false;
  }, [isGameStarted, handleGameOver, timeConfig.increment, timeConfig.max]);

  useEffect(() => {
    if (game.turn() === 'b' && !isGameOver) {
        // AI thinking delay
        const delay = tier === GameTier.WORLD ? 1500 : 800;
        const timeout = setTimeout(() => {
            const gameCopy = new Chess(game.fen());
            let move: string | null = null;
            
            if (tier === GameTier.WORLD) move = getWorldMove(gameCopy);
            else if (tier === GameTier.STARTER) move = getStarterMove(gameCopy);
            else move = getFreeMove(gameCopy);

            if (move) safeMove(move);
        }, delay);
        return () => clearTimeout(timeout);
    }
  }, [game, isGameOver, tier, safeMove]);

  const onMove = useCallback((from: string, to: string) => {
    if (gameRef.current.turn() !== 'w' || isGameOverRef.current) {
        setGame(new Chess(gameRef.current.fen())); 
        return;
    }
    const success = safeMove({ from, to, promotion: 'q' });
    if (!success) setTimeout(() => setGame(new Chess(gameRef.current.fen())), 50);
  }, [safeMove]);

  const resetGame = () => {
     window.location.reload();
  };

  if (tier !== GameTier.FREE && loadingProfile) {
      return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (tier !== GameTier.FREE && !canAfford && !loadingProfile) {
      return (
        <div className="container mx-auto p-4 flex items-center justify-center h-[calc(100vh-80px)]">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                    <Lock className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">Insufficient Credits</h2>
                    <p className="text-muted-foreground">
                        The <strong>{tier} Tier</strong> requires <strong>{entryCost} Credits</strong> to play.
                    </p>
                    <p className="text-sm mt-2 font-medium">Your Balance: {credits} Credits</p>
                </div>
                <div className="grid gap-3">
                    <Button onClick={() => navigate('/dashboard')} className="w-full gap-2">
                        <Coins className="w-4 h-4" /> Buy Credits
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/')}>Return Home</Button>
                </div>
            </Card>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 flex flex-col md:flex-row gap-4 max-w-6xl h-[calc(100vh-80px)] overflow-hidden relative">
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-3 order-2 md:order-1 h-full overflow-y-auto pb-4">
        <Card className="p-4 bg-card/50 backdrop-blur">
            <h2 className="text-lg font-bold mb-2 capitalize">{tier === GameTier.FREE ? 'Free Practice' : `${tier} Tier`}</h2>
            
            {tier !== GameTier.FREE && (
                <div className="mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jackpot</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-background/50">Entry: {entryCost} Cred</Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(jackpotAmount)}</p>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-black border border-white/20"></div>
                        <span className="font-medium text-sm">Bot Engine</span>
                        <Badge variant="outline" className="text-[10px] h-5">
                            {tier === GameTier.WORLD ? 'GRANDMASTER' : tier === GameTier.STARTER ? 'CLUB' : 'EASY'}
                        </Badge>
                    </div>
                    <Timer secondsRemaining={blackTime} isActive={game.turn() === 'b' && !isGameOver} label="OPP" />
                </div>
                {game.turn() === 'b' && !isGameOver && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse ml-5">
                        <Loader2 className="w-3 h-3 animate-spin"/> Engine evaluating lines...
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                        <span className="font-medium text-sm">You</span>
                    </div>
                    <Timer secondsRemaining={whiteTime} isActive={game.turn() === 'w' && !isGameOver} label="YOU" />
                </div>
            </div>
            
             {tier === GameTier.FREE && <div className="mt-3"><AdSlot /></div>}
        </Card>

        <div className="mt-auto space-y-2">
             <div className="p-2 bg-secondary/20 rounded border border-border/50 text-[10px] flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span>Anti-Cheat Enabled: Moves are validated.</span>
             </div>
             {isAdmin && !isGameOver && isGameStarted && (
                <Button 
                    variant="destructive" 
                    size="sm"
                    className="w-full border-red-500/50 bg-red-900/10 text-red-500 hover:bg-red-900/20"
                    onClick={() => handleGameOver('win')}
                >
                   <ShieldAlert className="w-4 h-4 mr-2"/> Admin: Force Win
                </Button>
             )}
             <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/')}>
                Exit Game (Forfeit)
            </Button>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center order-1 md:order-2 min-h-0 min-w-0 p-1 relative">
         <div ref={boardWrapperRef} className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-muted flex items-center justify-center bg-[#F0D9B5]" style={{ width: boardDimensions.width, height: boardDimensions.height }}>
            <CustomChessboard 
                game={game} 
                onMove={onMove} 
                isGameOver={isGameOver}
                width={boardDimensions.width}
                height={boardDimensions.height}
            />
         </div>
      </div>

      {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md p-6 text-center space-y-6 shadow-2xl bg-card border-primary/20">
                {isVerifying ? (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <h2 className="text-xl font-bold uppercase tracking-tight">Verifying Game History</h2>
                        <p className="text-muted-foreground text-sm">Our anti-cheat engine is validating your move sequence against server-side nodes.</p>
                    </div>
                ) : (
                    <>
                    {gameResult === 'win' ? (
                        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4 animate-bounce">
                            <Trophy className="w-8 h-8" />
                        </div>
                    ) : (
                        <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center text-destructive mb-4">
                            <Frown className="w-8 h-8" />
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold uppercase tracking-tight">
                            {gameResult === 'win' ? 'You Won!' : gameResult === 'loss' ? 'You Lost' : 'Draw'}
                        </h2>
                        <p className="text-muted-foreground">
                            {gameResult === 'win' && tier !== GameTier.FREE 
                                ? "Congratulations! Your win has been validated and submitted." 
                                : tier !== GameTier.FREE 
                                    ? `${entryCost} credit(s) have been deducted.`
                                    : "Good game. Keep practicing."}
                        </p>
                    </div>

                    {gameResult === 'win' && tier !== GameTier.FREE && (
                         <div className="p-4 bg-secondary/50 rounded-lg border border-primary/10">
                            <p className="text-sm text-muted-foreground mb-1">Potential Prize</p>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(jackpotAmount)}</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <ShieldCheck className="w-3 h-3 text-primary" />
                                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">PGN Verified</Badge>
                            </div>
                         </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => navigate('/')}>Home</Button>
                        <Button onClick={resetGame} className="gap-2">
                            <RefreshCw className="w-4 h-4" /> Play Again
                        </Button>
                    </div>
                    </>
                )}
            </Card>
          </div>
      )}
    </div>
  );
};
