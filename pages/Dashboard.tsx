import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { User, GameTier } from '../types';
import { Wallet, History, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { getJackpotInfo } from '../lib/jackpot/jackpotLogic';

// Mock user
const mockUser: User = {
  id: 'u_123',
  name: 'Alex Gambit',
  email: 'alex@example.com',
  credits: 5,
  monthlyWins: 0,
};

const mockHistory = [
  { id: 'g_1', date: '2024-05-20', tier: GameTier.FREE, result: 'win', prize: 0 },
  { id: 'g_2', date: '2024-05-19', tier: GameTier.STARTER, result: 'loss', prize: 0 },
  { id: 'g_3', date: '2024-05-18', tier: GameTier.WORLD, result: 'loss', prize: 0 },
];

export const Dashboard = () => {
  const jackpots = getJackpotInfo();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">Welcome back, {mockUser.name}</h1>
            <p className="text-muted-foreground">Manage your credits and view game history.</p>
        </div>
        <div className="flex items-center gap-2">
             <Badge variant="outline" className="text-lg py-1 px-3 border-primary/50 text-primary">
                {mockUser.credits} Credits Available
             </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Credits Management */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5"/> Buy Credits</CardTitle>
                <CardDescription>Credits are used to enter Jackpot games.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5">
                        <span className="text-2xl font-bold">10 Credits</span>
                        <span className="text-muted-foreground">$10.00</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5">
                        <span className="text-2xl font-bold">20 Credits</span>
                        <span className="text-muted-foreground">$20.00</span>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                    Secure payment processing via Stripe (Mock).
                </p>
            </CardContent>
        </Card>

        {/* Eligibility Status */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="font-medium text-sm">Starter Jackpot</p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">{mockUser.monthlyWins}/1 Wins this month</span>
                        <Badge variant={mockUser.monthlyWins === 0 ? "secondary" : "destructive"}>
                            {mockUser.monthlyWins === 0 ? "Eligible" : "Ineligible"}
                        </Badge>
                    </div>
                </div>
                <div className="pt-4 border-t border-border">
                    <p className="font-medium text-sm">World Jackpot</p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">Unlimited Attempts</span>
                         <Badge variant="gold">Eligible</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5"/> Game History</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {mockHistory.map((game) => (
                      <div key={game.id} className="flex justify-between items-center p-3 rounded-lg border bg-secondary/10">
                          <div>
                              <p className="font-medium capitalize">{game.tier} Tier</p>
                              <p className="text-xs text-muted-foreground">{game.date}</p>
                          </div>
                          <div className="text-right">
                              <Badge variant={game.result === 'win' ? 'gold' : 'secondary'}>
                                {game.result.toUpperCase()}
                              </Badge>
                              {game.prize > 0 && <p className="text-sm text-green-500 font-bold mt-1">+{formatCurrency(game.prize)}</p>}
                          </div>
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>
    </div>
  );
};
