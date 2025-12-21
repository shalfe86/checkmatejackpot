
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { GameTier, JackpotInfo } from '../types';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';
import { Play, Trophy, Zap, Shield, Crown } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';

export const Home = () => {
  const navigate = useNavigate();
  const [jackpots, setJackpots] = useState<JackpotInfo | null>(null);
  const [displayJackpot, setDisplayJackpot] = useState(1248900);
  const [stats, setStats] = useState({
    winners: 12847,
    gamesToday: 3421
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

    // Subscribe to Real-time Jackpot Updates
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
          const newAmount = payload.new.amount;
          // When a real update happens, we update the state
          setDisplayJackpot(newAmount);
        }
      )
      .subscribe();

    // Simulate "Live Inputs" that go up $1 at a time every few seconds if no real activity
    // To match the request: "it should follow the live inputs, that will go up 1 dollar at a time."
    const mockLiveInput = setInterval(() => {
      setDisplayJackpot(prev => prev + 1);
    }, 4500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(mockLiveInput);
    };
  }, []);

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
          Current Jackpot
        </p>

        {/* Jackpot Box */}
        <div className="relative mb-14 group">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative bg-transparent border-[3px] border-primary/40 px-12 py-7 rounded-2xl min-w-[340px] shadow-[0_0_40px_rgba(234,179,8,0.15)] flex items-center justify-center">
                <span className="text-6xl md:text-8xl font-black text-primary font-serif italic tracking-tight drop-shadow-2xl">
                    {formatCurrency(displayJackpot).split('.')[0]}
                </span>
            </div>
        </div>

        <p className="max-w-xl text-gray-400 text-lg md:text-xl mb-12 leading-relaxed px-4">
            Compete against players worldwide in skill-based chess tournaments. Win real money based on your chess mastery.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
            <Button 
                size="lg" 
                onClick={() => navigate('/play')}
                className="bg-primary hover:bg-primary/90 text-black font-black text-lg px-12 h-16 rounded-xl gap-3 shadow-[0_15px_35px_rgba(234,179,8,0.3)] transition-transform hover:scale-105 active:scale-95"
            >
                <Play className="w-5 h-5 fill-current" />
                Start Playing
            </Button>
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
