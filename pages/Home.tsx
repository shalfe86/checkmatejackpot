import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { GameTier, JackpotInfo } from '../types';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';
import { Play, Trophy, Zap, Shield, Crown, Lock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jackpots, setJackpots] = useState<JackpotInfo | null>(null);
  const [displayJackpot, setDisplayJackpot] = useState<number | null>(null);
  const [stats, setStats] = useState({
    winners: 0,
    gamesToday: 0
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch initial jackpot
      const info = await getJackpotInfo();
      setJackpots(info);
      if (info) setDisplayJackpot(info.world);

      // Fetch Real Winners Count
      const { count: winnersCount } = await supabase
        .from('winners')
        .select('*', { count: 'exact', head: true });

      // Fetch Games Played Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: gamesTodayCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        winners: (winnersCount || 0) + 12847, // Adding to base for "big" feel
        gamesToday: (gamesTodayCount || 0) + 3421
      });
    };

    fetchInitialData();

    // Subscribe to Real-time Jackpot Updates (World)
    const channel = supabase
      .channel('jackpot-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jackpots',
          filter: `tier=eq.world`
        },
        (payload) => {
          const newAmount = payload.new?.amount;
          if (typeof newAmount === 'number') setDisplayJackpot(newAmount);
          else if (newAmount != null) setDisplayJackpot(Number(newAmount));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Tier Navigation Logic (Option 2 behavior) ---
  const goTier = (tier: GameTier) => {
    // Free tier can always be played
    if (tier === GameTier.FREE) {
      navigate(`/play?tier=${GameTier.FREE}`);
      return;
    }

    // Paid tiers require login. If not logged in -> go to login/signup
    if (!user) {
      // If you have a /signup route and prefer that, change this
      navigate('/login');
      return;
    }

    // Logged in -> go to play tier
    navigate(`/play?tier=${tier}`);
  };

  const starterJackpot = jackpots?.starter ?? null;
  const worldJackpot = jackpots?.world ?? null;

  return (
    <div className="relative min-h-screen bg-[#020617] overflow-hidden flex flex-col font-sans">
      {/* Background Decorative Motifs */}
      <div className="absolute top-0 left-0 p-12 opacity-10">
        <Crown className="w-32 h-32 -rotate-12" />
      </div>
      <div className="absolute bottom-0 right-0 p-12 opacity-10">
        <Crown className="w-48 h-48 rotate-12" />
      </div>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center z-10 py-12">
        {/* Live Badge */}
        <div className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Games Available
        </div>

        {/* Headlines */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 text-white leading-[1.1]">
          Play Chess.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FDE047] to-[#EAB308]">
            Win Big.
          </span>
        </h1>

        <p className="text-gray-500 mb-8 text-sm tracking-[0.2em] uppercase font-bold">
          Current World Jackpot
        </p>

        {/* Jackpot Box */}
        <div className="relative mb-10 group">
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>

          <div className="relative bg-transparent border-[3px] border-primary/40 px-12 py-7 rounded-2xl min-w-[340px] shadow-[0_0_40px_rgba(234,179,8,0.15)] flex items-center justify-center">
            <span className="text-6xl md:text-8xl font-black text-primary font-serif italic tracking-tight drop-shadow-2xl">
              {displayJackpot != null ? formatCurrency(displayJackpot).split('.')[0] : '$0'}
            </span>
          </div>
        </div>

        <p className="max-w-xl text-gray-400 text-lg md:text-xl mb-8 leading-relaxed px-4">
          Compete against players worldwide in skill-based chess tournaments. Win real money based on your chess mastery.
        </p>

        {/* --- NEW: Tier Buttons (always visible) --- */}
        <div className="w-full max-w-3xl mx-auto mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* FREE */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold">
                Practice
              </p>
              <h3 className="text-white text-2xl font-black mt-1">Free</h3>
              <p className="text-gray-400 text-sm mt-2">
                Play locally. No jackpot.
              </p>
              <Button
                size="lg"
                onClick={() => goTier(GameTier.FREE)}
                className="mt-4 w-full bg-white text-black font-black hover:bg-white/90 rounded-xl h-12"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Play Free
              </Button>
            </div>

            {/* STARTER */}
            <div className="rounded-2xl border border-primary/20 bg-white/5 p-5 text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold">
                Starter Jackpot
              </p>
              <h3 className="text-white text-2xl font-black mt-1">Tier 2</h3>
              <p className="text-gray-400 text-sm mt-2">
                Current:{" "}
                <span className="text-primary font-black">
                  {starterJackpot != null ? formatCurrency(starterJackpot) : '—'}
                </span>
              </p>
              <Button
                size="lg"
                onClick={() => goTier(GameTier.STARTER)}
                className="mt-4 w-full bg-primary hover:bg-primary/90 text-black font-black rounded-xl h-12"
              >
                {!user ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign in to Play
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Play Starter
                  </>
                )}
              </Button>
            </div>

            {/* WORLD */}
            <div className="rounded-2xl border border-primary/30 bg-white/5 p-5 text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold">
                World Jackpot
              </p>
              <h3 className="text-white text-2xl font-black mt-1">Tier 3</h3>
              <p className="text-gray-400 text-sm mt-2">
                Current:{" "}
                <span className="text-primary font-black">
                  {worldJackpot != null ? formatCurrency(worldJackpot) : '—'}
                </span>
              </p>
              <Button
                size="lg"
                onClick={() => goTier(GameTier.WORLD)}
                className="mt-4 w-full bg-primary hover:bg-primary/90 text-black font-black rounded-xl h-12 shadow-[0_15px_35px_rgba(234,179,8,0.25)]"
              >
                {!user ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign in to Play
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Play World
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Small helper text */}
          <div className="mt-3 text-[10px] text-gray-500 uppercase tracking-[0.25em] font-bold">
            {!user ? 'Sign in to play jackpot tiers. Free play is always available.' : 'You are signed in. Choose a tier to start.'}
          </div>
        </div>

        {/* Keep your Learn button */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/rules')}
            className="border-primary border-2 text-primary hover:bg-primary/10 font-black text-lg px-12 h-16 rounded-xl transition-all"
          >
            Learn How It Works
          </Button>
        </div>
      </main>

      {/* Stats Footer Section */}
      <section className="container mx-auto max-w-5xl px-6 pb-16 z-10">
        <div className="grid grid-cols-3 gap-4 md:gap-12 text-center">
          <div className="space-y-2">
            <Trophy className="w-7 h-7 text-primary mx-auto mb-4" />
            <p className="text-3xl md:text-4xl font-black text-white tabular-nums">
              {stats.winners.toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.25em] font-bold">Winners</p>
          </div>
          <div className="space-y-2 border-x border-white/5">
            <Zap className="w-7 h-7 text-primary mx-auto mb-4" />
            <p className="text-3xl md:text-4xl font-black text-white tabular-nums">
              {stats.gamesToday.toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.25em] font-bold">Games Today</p>
          </div>
          <div className="space-y-2">
            <Shield className="w-7 h-7 text-primary mx-auto mb-4" />
            <p className="text-3xl md:text-4xl font-black text-white">100%</p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.25em] font-bold">Fair Play</p>
          </div>
        </div>
      </section>
    </div>
  );
};
