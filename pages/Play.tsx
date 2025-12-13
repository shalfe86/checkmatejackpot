import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Timer } from '../components/Timer';
import { AdSlot } from '../components/AdSlot';
import { GameTier } from '../types';
import { getStarterMove, getWorldMove } from '../lib/ai/chessAI';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';
import { formatCurrency } from '../lib/utils';
import { Trophy, Frown, RefreshCw } from 'lucide-react';

const INITIAL_TIME = 20; // 20 seconds base
const INCREMENT = 1; // 1 second per move

export const Play = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tier = (queryParams.get('tier') as GameTier) || 'free';

  // Game State
  const [game, setGame] = useState(new Chess());
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);

  // Refs for intervals and state access in intervals
  const timerInterval = useRef<number | null>(null);
  const gameRef = useRef(game);
  const isGameOverRef = useRef(isGameOver);

  // Sync refs
  useEffect(() => {
    gameRef.current = game;
    isGameOverRef.current = isGameOver;
  }, [game, isGameOver]);

  // Jackpot info
  const jackpots = getJackpotInfo();
  const jackpotAmount = tier === 'starter' ? jackpots.starter : tier === 'world' ? jackpots.world : 0;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) window.clearInterval(timerInterval.current);
    };
  }, []);

  const handleGameOver = useCallback((result: 'win' | 'loss' | 'draw') => {
    if (isGameOverRef.current) return;
    setIsGameOver(true);
    setGameResult(result);
    if (timerInterval.current) window.clearInterval(timerInterval.current);
    console.log(`Game Over: ${result}`);
  }, []);

  // Timer Interval
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
  }, [isGameStarted, isGameOver, handleGameOver]);

  // Move Helper
  const safeMove = useCallback((move: { from: string; to: string; promotion?: string } | string) => {
    try {
        const gameCopy = new Chess(game.fen());
        let result = null;
        
        // Handle string vs object moves
        if (typeof move === 'string') {
             result = gameCopy.move(move);
        } else {
             // Handle promotion quirks
             try {
                result = gameCopy.move(move);
             } catch (e) {
                if (move.promotion) {
                    try {
                        result = gameCopy.move({ from: move.from, to: move.to });
                    } catch(e2) { return null; }
                } else {
                    return null;
                }
             }
        }

        if (result) {
            setGame(gameCopy);
            
            // Add increment
            if (gameCopy.turn() === 'b') { // Player just moved
                setWhiteTime(t => t + INCREMENT);
            } else { // AI just moved
                setBlackTime(t => t + INCREMENT);
            }
            
            if (!isGameStarted) setIsGameStarted(true);
            
            // Check Game Over
            if (gameCopy.isGameOver()) {
                if (gameCopy.isCheckmate()) {
                    handleGameOver(gameCopy.turn() === 'w' ? 'loss' : 'win');
                } else {
                    handleGameOver('draw');
                }
            }
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
  }, [game, isGameStarted, handleGameOver]);

  // AI Turn
  useEffect(() => {
    if (game.turn() === 'b' && !isGameOver) {
        const delay = Math.random() * 500 + 500;
        const timeout = setTimeout(() => {
            const gameCopy = new Chess(game.fen());
            let move: string | null = null;
            
            if (tier === 'world') {
                move = getWorldMove(gameCopy);
            } else {
                move = getStarterMove(gameCopy);
            }

            if (move) {
                safeMove(move);
            }
        }, delay);
        return () => clearTimeout(timeout);
    }
  }, [game, isGameOver, tier, safeMove]);

  // Player Drop Handler
  function onDrop(sourceSquare: string, targetSquare: string) {
    if (game.turn() !== 'w' || isGameOver) return false;
    return safeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
  }

  const resetGame = () => {
    setGame(new Chess());
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
    setIsGameStarted(false);
    setIsGameOver(false);
    setGameResult(null);
    if (timerInterval.current) {
        window.clearInterval(timerInterval.current);
        timerInterval.current = null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 max-w-6xl h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 flex flex-col gap-6 order-2 md:order-1">
        <Card className="p-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-bold mb-4 capitalize">{tier === 'free' ? 'Free Practice' : `${tier} Tier Challenge`}</h2>
            
            {tier !== 'free' && (
                <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Current Jackpot</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(jackpotAmount)}</p>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-black border border-white/20"></div>
                        <span className="font-medium">Bot (AI)</span>
                    </div>
                    <Timer secondsRemaining={blackTime} isActive={game.turn() === 'b' && !isGameOver} label="OPPONENT" />
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                        <span className="font-medium">You</span>
                    </div>
                    <Timer secondsRemaining={whiteTime} isActive={game.turn() === 'w' && !isGameOver} label="YOU" />
                </div>
            </div>
        </Card>

        {tier === 'free' && <AdSlot />}

        <div className="mt-auto">
             <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
                Exit Game
            </Button>
        </div>
      </div>

      {/* Board */}
      <div className="w-full md:w-2/3 flex justify-center items-center order-1 md:order-2">
         <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-muted">
            <Chessboard 
                position={game.fen()} 
                onPieceDrop={onDrop}
                boardOrientation="white"
                customDarkSquareStyle={{ backgroundColor: '#B58863' }}
                customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
                animationDuration={200}
                arePiecesDraggable={!isGameOver} 
            />
         </div>
      </div>

      {/* Modal */}
      {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md p-6 text-center space-y-6 shadow-2xl bg-card border-primary/20">
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
                        {gameResult === 'win' && tier !== 'free' 
                            ? "Congratulations! Your game has been submitted for verification." 
                            : "Good game. Keep practicing to improve your skills."}
                    </p>
                </div>

                {gameResult === 'win' && tier !== 'free' && (
                     <div className="p-4 bg-secondary/50 rounded-lg border border-primary/10">
                        <p className="text-sm text-muted-foreground mb-1">Potential Prize</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(jackpotAmount)}</p>
                        <Badge variant="outline" className="mt-2 text-xs border-primary/30 text-primary">Pending Review</Badge>
                     </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => navigate('/')}>Home</Button>
                    <Button onClick={resetGame} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Play Again
                    </Button>
                </div>
            </Card>
          </div>
      )}
    </div>
  );
};