import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { JackpotCard } from '../components/JackpotCard';
import { GameTier } from '../types';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';
import { ArrowRight, PlayCircle } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const jackpots = getJackpotInfo();

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center space-y-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50 pointer-events-none"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Beat the Bot. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Win the Jackpot.
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The world's first speed-chess jackpot platform. Prove your skills against our AI engines and take home real cash prizes.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" onClick={() => navigate('/play?mode=free')} variant="outline" className="gap-2">
                <PlayCircle className="w-5 h-5" />
                Play for Free
            </Button>
            <Button size="lg" onClick={() => navigate('/play?tier=starter')} className="gap-2 font-bold">
                Play Starter Tier <ArrowRight className="w-4 h-4" />
            </Button>
        </div>
      </section>

      {/* Jackpots */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8">
            <JackpotCard
                title="Starter Jackpot"
                amount={jackpots.starter}
                tier={GameTier.STARTER}
                isCapped={jackpots.starter >= jackpots.starterCap}
                entryFee="$1.00 or 1 Credit"
                description="Perfect for beginners. Win up to $1,000 against a balanced AI."
                eligibility="1 Win / Month / User"
            />
            <JackpotCard
                title="World Jackpot"
                amount={jackpots.world}
                tier={GameTier.WORLD}
                entryFee="$2.00 or 2 Credits"
                description="The ultimate challenge. Uncapped jackpot grows with every game played."
                eligibility="Unlimited Attempts"
            />
        </div>
      </section>

      {/* Features / Trust */}
      <section className="container mx-auto px-4 py-12 border-t border-border/50">
        <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
                <h3 className="font-bold text-lg">Fair Play AI</h3>
                <p className="text-sm text-muted-foreground">Our engines are calibrated for fair, exciting matches at every skill level.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-lg">Instant Payouts</h3>
                <p className="text-sm text-muted-foreground">Winnings are credited to your account immediately after game review.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-lg">Secure Platform</h3>
                <p className="text-sm text-muted-foreground">Built with industry-standard security to keep your data and funds safe.</p>
            </div>
        </div>
      </section>
    </div>
  );
};
