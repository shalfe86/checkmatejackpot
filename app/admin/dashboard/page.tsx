import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { formatCurrency } from '../../../lib/utils';
import { Users, Trophy, DollarSign, Activity, AlertCircle, Loader2, Database } from 'lucide-react';
import { Winner } from '../../../types';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalWinners: 0,
    pendingKYC: 0,
    totalPayouts: 0,
    flagged: 0
  });
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch winners for stats - selecting * is safer to avoid missing column errors if schema drifts
        const { data: winners, error: supabaseError } = await supabase
            .from('winners')
            .select('*');

        if (supabaseError) throw supabaseError;

        if (winners) {
            const totalWinners = winners.length;
            const pendingKYC = winners.filter(w => w.kyc_status === 'pending').length;
            const flagged = winners.filter(w => w.status === 'flagged').length;
            const totalPayouts = winners.reduce((acc, curr) => acc + (curr.amount || 0), 0);

            setStats({ totalWinners, pendingKYC, totalPayouts, flagged });
            
            // Get recent 5
            const recent = [...winners]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);
            setRecentWinners(recent);
        }
      } catch (err: any) {
        console.error("Error fetching admin stats:", err.message || err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error) {
      const isTableMissing = error.includes('Could not find the table') || error.includes('does not exist');
      
      return (
          <div className="p-8 text-center border border-destructive/20 bg-destructive/5 rounded-lg max-w-2xl mx-auto">
              {isTableMissing ? (
                  <>
                     <Database className="w-12 h-12 text-destructive mx-auto mb-4" />
                     <h3 className="font-bold text-xl text-destructive mb-2">Database Setup Required</h3>
                     <p className="text-muted-foreground mb-4">
                        The <code>winners</code> table was not found in your Supabase project. 
                     </p>
                     <div className="bg-background p-4 rounded text-left text-xs font-mono border border-border overflow-auto max-h-40 mb-4">
                        <p className="text-muted-foreground">// Please run the contents of <strong>supabase/schema.sql</strong> in your Supabase SQL Editor.</p>
                     </div>
                     <p className="text-sm">After running the SQL, refresh this page.</p>
                  </>
              ) : (
                  <>
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <h3 className="font-bold text-destructive">Error Loading Dashboard</h3>
                    <p className="text-muted-foreground">{error}</p>
                  </>
              )}
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winners</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWinners}</div>
            <p className="text-xs text-muted-foreground">Lifetime jackpots won</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingKYC}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPayouts)}</div>
            <p className="text-xs text-muted-foreground">Total prize value generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Accounts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.flagged}</div>
            <p className="text-xs text-muted-foreground">Suspicious activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Wins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
                {recentWinners.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                ) : (
                    recentWinners.map((w) => (
                        <div key={w.id} className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Winner ID: {w.user_id ? w.user_id.slice(0, 8) : 'Unknown'}...</p>
                                <p className="text-sm text-muted-foreground">
                                    Won <span className="text-foreground font-medium">{formatCurrency(w.amount)}</span> in {w.tier} tier
                                </p>
                            </div>
                            <div className="ml-auto font-medium text-xs text-muted-foreground">
                                {new Date(w.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions / System Health (Mock) */}
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/10">
                        <span className="text-sm">Database Status</span>
                        <span className="text-sm text-green-500 font-medium flex items-center gap-1"><Activity className="w-3 h-3"/> Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/10">
                        <span className="text-sm">Payment Gateway</span>
                        <span className="text-sm text-green-500 font-medium flex items-center gap-1"><Activity className="w-3 h-3"/> Connected</span>
                    </div>
                     <div className="flex items-center justify-between p-2 rounded bg-secondary/10">
                        <span className="text-sm">Email Service</span>
                        <span className="text-sm text-yellow-500 font-medium flex items-center gap-1"><Activity className="w-3 h-3"/> Degrading</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
