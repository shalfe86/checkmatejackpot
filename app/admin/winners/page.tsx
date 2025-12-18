
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Winner, GameTier } from '../../../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { WinnerDetailSheet } from '../../../components/admin/WinnerDetailSheet';
import { formatCurrency } from '../../../lib/utils';
import { Loader2, Search, Filter, Eye, AlertCircle } from 'lucide-react';

export const WinnersPage = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchWinners = async () => {
    setLoading(true);
    setError(null);
    try {
        // Step 1: Fetch winners without join to avoid FK relationship errors
        const { data: winnersData, error: supabaseError } = await supabase
            .from('winners')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (supabaseError) throw supabaseError;

        if (!winnersData || winnersData.length === 0) {
            setWinners([]);
            setLoading(false);
            return;
        }

        // Step 2: Manually fetch profiles for these winners
        const userIds = Array.from(new Set(winnersData.map(w => w.user_id).filter(Boolean)));
        
        let profileMap = new Map();
        
        if (userIds.length > 0) {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, email, username')
                .in('id', userIds);
            
            if (profilesData) {
                profilesData.forEach(p => profileMap.set(p.id, p));
            }
        }

        // Step 3: Merge data
        const formatted = winnersData.map(row => {
            const profile = profileMap.get(row.user_id);
            return {
                ...row,
                email: profile?.email || 'Unknown',
                username: profile?.username || 'Unknown User'
            };
        });
        
        setWinners(formatted);
    } catch (err: any) {
        console.error('Error fetching winners:', err.message || err);
        setError(err.message || "Failed to load winners.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  const handleView = (winner: Winner) => {
      setSelectedWinner(winner);
      setIsSheetOpen(true);
  };

  const filteredWinners = winners.filter(w => 
      w.id.includes(search) || 
      (w.email && w.email.toLowerCase().includes(search.toLowerCase())) ||
      (w.tier && w.tier.toLowerCase().includes(search.toLowerCase()))
  );

  if (error) {
     return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold tracking-tight">Winners Management</h1>
             <div className="p-8 text-center border border-destructive/20 bg-destructive/5 rounded-lg max-w-2xl mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <h3 className="font-bold text-destructive">Error Loading Winners</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchWinners} variant="outline">Retry</Button>
            </div>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Winners Management</h1>
            <p className="text-muted-foreground">Verify identities, approve payouts, and track schedules.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search ID, Email..." 
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button variant="outline"><Filter className="w-4 h-4 mr-2"/> Filter</Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Winner Info</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payout Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                    </TableRow>
                ) : filteredWinners.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            No winners found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredWinners.map((winner) => (
                        <TableRow key={winner.id}>
                            <TableCell>
                                <div className="font-medium">{winner.username || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground">{winner.email}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={winner.tier === GameTier.WORLD ? 'gold' : 'secondary'}>{winner.tier}</Badge>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                                {formatCurrency(winner.amount)}
                            </TableCell>
                            <TableCell className="capitalize text-sm">
                                {winner.payout_type?.replace('_', ' ')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    winner.status === 'paid' ? 'default' : 
                                    winner.status === 'flagged' ? 'destructive' : 
                                    winner.status === 'scheduled' ? 'outline' : 'secondary'
                                }>
                                    {winner.status?.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {new Date(winner.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => handleView(winner)}>
                                    <Eye className="w-4 h-4 text-primary" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      <WinnerDetailSheet 
        winner={selectedWinner} 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        onUpdate={fetchWinners}
      />
    </div>
  );
};
