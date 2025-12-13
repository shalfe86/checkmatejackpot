import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Clock, Trophy, AlertTriangle, ShieldCheck, Coins } from 'lucide-react';

export const Rules = () => {
  // Ensure page scrolls to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Rules of Play</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Welcome to CheckMate Jackpot. Please review our rules to ensure fair, consistent, and transparent gameplay across all tiers.
        </p>
      </div>

      {/* 1. Game Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">1.</span> Game Overview
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          All games are played against an AI using standard chess rules. To win a jackpot, a player must defeat the AI by checkmate or by causing the AI to run out of time. A draw is considered a loss for jackpot purposes.
        </p>
        <p className="text-muted-foreground">The platform offers three tiers, each with distinct time controls, difficulty levels, and mechanics.</p>
      </section>

      {/* Tiers Breakdown */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Tier */}
        <Card className="border-muted bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="outline">Free</Badge> Practice Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time Controls</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Start: 40s</li>
                <li>Inc: +2s</li>
                <li>Max: 50s</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Features</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>No account required</li>
                <li>No payouts</li>
                <li>Unlimited play</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground italic mt-2">Moderate strength for training.</p>
          </CardContent>
        </Card>

        {/* Starter Tier */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="secondary">Starter</Badge> Tier 2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div>
              <p className="font-semibold mb-1 text-primary">Entry: $1.00</p>
            </div>
            <div>
              <p className="font-semibold mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time Controls</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Start: 30s</li>
                <li>Inc: +2s</li>
                <li>Max: 35s</li>
              </ul>
            </div>
             <div>
              <p className="font-semibold mb-1 flex items-center gap-1"><Trophy className="w-3 h-3"/> Jackpot</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Starts at $5</li>
                <li>+$0.75 / game</li>
                <li>Capped at $1,000</li>
                <li>1 Win / Month</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* World Tier */}
        <Card className="border-primary bg-gradient-to-b from-primary/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="gold">World</Badge> Tier 3
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div>
              <p className="font-semibold mb-1 text-primary">Entry: $2.00</p>
            </div>
            <div>
              <p className="font-semibold mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time Controls</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Start: 25s</li>
                <li>Inc: +1s</li>
                <li>Max: 25s</li>
              </ul>
            </div>
             <div>
              <p className="font-semibold mb-1 flex items-center gap-1"><Trophy className="w-3 h-3"/> Jackpot</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Starts at $5</li>
                <li>+$1.00 / game</li>
                <li>Uncapped</li>
                <li>Unlimited Wins</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Awarding */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">5.</span> Jackpot Awarding & Priority
        </h2>
        <div className="bg-secondary/20 p-6 rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">If multiple games are active when a jackpot is won:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>The jackpot is awarded to the <strong className="text-foreground">earliest-started winning game</strong>.</li>
                <li>Later games display “Pending Jackpot Verification”.</li>
                <li>After awarding, Tier 2 resets to $5, while Tier 3 continues growing if applicable.</li>
            </ul>
        </div>
      </section>

      {/* 6. Eligibility */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">6.</span> Player Eligibility
        </h2>
        <ul className="grid sm:grid-cols-2 gap-4">
            <li className="flex items-start gap-3 p-3 rounded bg-card border border-muted">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground"><strong>Tier 2:</strong> Players may win once per calendar month.</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded bg-card border border-muted">
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground"><strong>Tier 3:</strong> No win limit (subject to review).</span>
            </li>
             <li className="flex items-start gap-3 p-3 rounded bg-card border border-muted">
                <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground"><strong>Verification:</strong> Users must complete identity verification to claim jackpots.</span>
            </li>
        </ul>
      </section>

      {/* 7. Verification & Tax */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">7.</span> Identity Verification & Tax Reporting
        </h2>
        <p className="text-muted-foreground">All jackpot payouts require identity verification for fraud prevention and legal compliance.</p>
        <div className="grid md:grid-cols-2 gap-8 mt-4">
            <div>
                <h3 className="font-bold mb-2 text-foreground">U.S. Players</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                    <li>May require legal name, address, government ID, and SSN.</li>
                    <li>Winnings totaling <strong>$600+ in a calendar year</strong> are reported to the IRS via Form 1099-MISC.</li>
                    <li>Failure to verify results in forfeiture.</li>
                </ul>
            </div>
            <div>
                <h3 className="font-bold mb-2 text-foreground">International Players</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                    <li>Must provide passport or national ID.</li>
                    <li>Responsible for complying with local tax laws.</li>
                    <li>Platform does not file international tax forms.</li>
                </ul>
            </div>
        </div>
      </section>

      {/* 8. Jurisdiction */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">8.</span> Jurisdiction & Country Restrictions
        </h2>
        <p className="text-muted-foreground">
            Users are responsible for ensuring participation is legal in their region. The platform may restrict or deny payouts where local law or payment systems do not support participation. If a payout cannot be legally delivered, the win may be void.
        </p>
      </section>

      {/* 9. Anti-Cheat */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">9.</span> Anti-Cheat Policy
        </h2>
        <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg">
            <p className="font-medium text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5"/> Use of external chess engines is strictly prohibited.
            </p>
            <p className="text-sm text-muted-foreground mb-4">Cheating indicators include engine-like accuracy, unnatural timing patterns, performance spikes, and matching top engine lines.</p>
            <p className="text-sm text-muted-foreground font-semibold">If cheating is suspected:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                <li>Payouts may be paused.</li>
                <li>Games may be reviewed.</li>
                <li>Accounts may be restricted or banned.</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4 uppercase tracking-wider">All review decisions are final.</p>
        </div>
      </section>

      {/* 10. Recording */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">10.</span> Game Recording & AI
        </h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>All games, moves, and timestamps are recorded.</li>
            <li>AI may analyze verified losses to improve training.</li>
            <li>Only verified, non-cheating wins influence AI logic.</li>
        </ul>
      </section>

      {/* 11. Credits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">11.</span> Credits & Payments
        </h2>
        <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
            <Coins className="w-6 h-6 text-primary mt-1" />
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Minimum purchase: $10 credit pack.</li>
                <li>Tier 2 entry: 1 credit ($1).</li>
                <li>Tier 3 entry: 2 credits ($2).</li>
                <li>Credits are non-refundable.</li>
                <li>Fees apply at credit purchase, not per game.</li>
            </ul>
        </div>
      </section>

      {/* 12. General */}
      <section className="space-y-4 pb-12">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">12.</span> General Conditions
        </h2>
        <p className="text-muted-foreground">
            The platform may adjust AI difficulty or game parameters to maintain fairness. Rule updates apply only to future games. By playing, you agree to these rules and to the Terms of Service.
        </p>
      </section>

    </div>
  );
};