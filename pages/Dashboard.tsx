
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Wallet, History, AlertCircle, Loader2, ShieldCheck, PlusCircle, Trophy, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { saveGameResult } from '../lib/game/saveGame';
import { GameTier } from '../types';

interface Profile {
  username: string;
  credits: number;
  monthly_wins: number;
  role: 'user' | 'admin';
}

interface GameHistoryItem {
  id: string;
  created_at: string;
  tier: string;
  result: 'win' | 'loss' | 'draw';
  prize: number;
}

export const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin State
  const [adminAmount, setAdminAmount] = useState('100');
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch History - Increased limit to 50 for scrolling
      const { data: historyData, error: historyError } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;
      setHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!user || !profile) return;
    setAdminLoading(true);
    try {
        const amount = parseInt(adminAmount);
        const { error } = await supabase.rpc('add_credits', {
            target_user_id: user.id,
            amount: amount
        });

        if (error) throw error;
        
        // Refresh data
        await fetchData();
        alert(`Successfully added ${amount} credits.`);
    } catch (e: any) {
        alert('Error adding credits: ' + e.message);
    } finally {
        setAdminLoading(false);
    }
  };

  const handleSimulateWin = async (tier: GameTier) => {
    if (!user) return;
    setAdminLoading(true);
    try {
        // Mock a win - in a real scenario we'd query jackpot amount first, but here 
        // we just trigger the record so the jackpot logic resets.
        await saveGameResult(user.id, tier, 'win', 0);
        await fetchData();
        alert(`Simulated ${tier} win! Jackpot should now be reset on the home page.`);
    } catch (e: any) {
        alert('Error simulating win: ' + e.message);
    } finally {
        setAdminLoading(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Welcome back, {profile?.username || user?.email}</h1>
                {profile?.role === 'admin' && (
                    <Badge variant="destructive" className="flex gap-1 items-center px-2 py-1">
                        <ShieldCheck className="w-3 h-3" /> Admin
                    </Badge>
                )}
            </div>
            <p className="text-muted-foreground">Manage your credits and view game history.</p>
        </div>
        <div className="flex items-center gap-2">
             <Badge className="text-lg py-1 px-3 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                {profile?.credits || 0} Credits Available
             </Badge>
        </div>
      </div>

      {/* Admin Console */}
      {profile?.role === 'admin' && (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                        <ShieldCheck className="w-5 h-5"/> Admin Console
                    </CardTitle>
                    <CardDescription>Internal tools for testing game economy.</CardDescription>
                </div>
                <Button onClick={() => navigate('/admin')} variant="destructive" className="gap-2">
                    <ExternalLink className="w-4 h-4" /> Open Admin Dashboard
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-end gap-4 max-w-sm">
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-medium">Add Credits (Test Mode)</label>
                        <Input 
                            type="number" 
                            value={adminAmount} 
                            onChange={(e) => setAdminAmount(e.target.value)} 
                        />
                    </div>
                    <Button onClick={handleAddCredits} disabled={adminLoading} variant="destructive">
                         {adminLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <PlusCircle className="w-4 h-4 mr-2"/>}
                         Inject Credits
                    </Button>
                </div>

                <div className="border-t border-destructive/20 pt-4">
                    <label className="text-xs font-medium block mb-2">Simulate Jackpot Reset (Inject Win)</label>
                    <div className="flex gap-4">
                         <Button onClick={() => handleSimulateWin(GameTier.STARTER)} disabled={adminLoading} variant="outline" className="border-destructive/30 hover:bg-destructive/10">
                             <Trophy className="w-4 h-4 mr-2" /> Win Starter
                         </Button>
                         <Button onClick={() => handleSimulateWin(GameTier.WORLD)} disabled={adminLoading} variant="outline" className="border-destructive/30 hover:bg-destructive/10">
                             <Trophy className="w-4 h-4 mr-2" /> Win World
                         </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Credits Management */}
        <Card className="md:col-span-2 border-0 bg-secondary/5 shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5"/> Buy Credits</CardTitle>
                <CardDescription>Credits are used to enter Jackpot games.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="ghost" className="h-24 flex flex-col gap-2 bg-secondary/20 hover:bg-primary/10 hover:text-primary transition-all">
                        <span className="text-2xl font-bold">10 Credits</span>
                        <span className="text-muted-foreground">$10.00</span>
                    </Button>
                    <Button variant="ghost" className="h-24 flex flex-col gap-2 bg-secondary/20 hover:bg-primary/10 hover:text-primary transition-all">
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
        <Card className="border-0 bg-secondary/5 shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="font-medium text-sm">Starter Jackpot</p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">{profile?.monthly_wins || 0}/1 Wins this month</span>
                        <Badge variant={(profile?.monthly_wins || 0) === 0 ? "secondary" : "destructive"}>
                            {(profile?.monthly_wins || 0) === 0 ? "Eligible" : "Ineligible"}
                        </Badge>
                    </div>
                </div>
                <div className="pt-4 border-t border-border/30">
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
      <Card className="border-0 bg-secondary/5 shadow-none">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5"/> Game History</CardTitle>
          </CardHeader>
          <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No games played yet.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((game) => (
                        <div key={game.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/20 border border-transparent hover:border-primary/10 transition-colors">
                            <div>
                                <p className="font-medium capitalize text-sm">{game.tier} Tier</p>
                                <p className="text-xs text-muted-foreground">{new Date(game.created_at).toLocaleDateString()} {new Date(game.created_at).toLocaleTimeString()}</p>
                            </div>
                            <div className="text-right">
                                <Badge variant={game.result === 'win' ? 'gold' : 'secondary'} className="mb-1">
                                  {game.result?.toUpperCase()}
                                </Badge>
                                {game.prize > 0 && <p className="text-xs text-green-500 font-bold">+{formatCurrency(game.prize)}</p>}
                            </div>
                        </div>
                    ))}
                </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
};
