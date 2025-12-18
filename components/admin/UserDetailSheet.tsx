
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import { Loader2, Save, User, Wallet, Shield, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { CreditTransaction } from '../../types';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  credits: number;
  role: 'user' | 'admin';
  monthly_wins: number;
  created_at?: string;
}

interface Props {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const UserDetailSheet = ({ user, open, onOpenChange, onUpdate }: Props) => {
  const [loading, setLoading] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Sync state when user opens
  React.useEffect(() => {
    if (user && open) {
        setRole(user.role);
        setCreditsToAdd('');
        fetchTransactions(user.id);
    }
  }, [user, open]);

  const fetchTransactions = async (userId: string) => {
      setLoadingTransactions(true);
      const { data } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) setTransactions(data);
      setLoadingTransactions(false);
  };

  const handleUpdateRole = async () => {
    setLoading(true);
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', user?.id);
        
        if (error) throw error;
        
        // Audit Log
        await supabase.from('audit_logs').insert({
            admin_id: (await supabase.auth.getUser()).data.user?.id,
            action: 'updated_user_role',
            target_id: user?.id,
            target_table: 'profiles',
            details: { old_role: user?.role, new_role: role }
        });

        onUpdate();
        alert('Role updated successfully');
    } catch (e: any) {
        alert('Error updating role: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!creditsToAdd || isNaN(parseInt(creditsToAdd)) || !user) return;
    setLoading(true);
    try {
        const amount = parseInt(creditsToAdd);
        
        // Use RPC if available
        const { error } = await supabase.rpc('add_credits', {
            target_user_id: user.id,
            amount: amount
        });

        if (error) {
            // Fallback to direct update if RPC fails (Not ideal for ledger, but functional fallback)
            const newBalance = (user.credits || 0) + amount;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: newBalance })
                .eq('id', user.id);
            if (updateError) throw updateError;
        }

        // Insert into ledger (if RPC didn't already handle it, assuming RPC handles it is safer, but we add manual record if manual update)
        // Note: Ideally 'add_credits' RPC does both. For this UI we assume the table exists now.
        // We'll manually insert a ledger entry here to be safe since we just updated schema.
        await supabase.from('credit_ledger').insert({
            user_id: user.id,
            amount: amount,
            type: 'admin_adjustment',
            description: 'Manual credit adjustment via Admin Panel'
        });
        
        // Audit
        await supabase.from('audit_logs').insert({
             admin_id: (await supabase.auth.getUser()).data.user?.id,
             action: 'added_credits',
             target_id: user.id,
             target_table: 'profiles',
             details: { amount_added: amount }
        });

        onUpdate();
        fetchTransactions(user.id);
        setCreditsToAdd('');
        alert(`Successfully added ${amount} credits.`);
    } catch (e: any) {
        alert('Error adding credits: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> User Details
          </SheetTitle>
          <SheetDescription>Manage account for {user.username}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
            {/* ID & Info */}
            <div className="p-4 bg-secondary/10 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50 mt-2">
                    <span className="text-muted-foreground font-medium">Monthly Wins:</span>
                    <Badge variant="secondary">{user.monthly_wins}</Badge>
                </div>
            </div>

            {/* Credits Management */}
            <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Credits Management
                </label>
                <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Balance</span>
                        <span className="text-xl font-bold text-primary">{user.credits}</span>
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            placeholder="Amount to add..." 
                            value={creditsToAdd}
                            onChange={(e) => setCreditsToAdd(e.target.value)}
                        />
                        <Button onClick={handleAddCredits} disabled={loading} size="sm">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Add'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger */}
             <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                    <History className="w-4 h-4" /> Recent Transactions
                </label>
                <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto bg-card">
                    {loadingTransactions ? (
                         <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto"/></div>
                    ) : transactions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No transactions found.</div>
                    ) : (
                        <div className="text-xs">
                             {transactions.map(t => (
                                 <div key={t.id} className="flex justify-between items-center p-2 border-b last:border-0 hover:bg-muted/50">
                                     <div className="flex items-center gap-2">
                                         {t.amount > 0 ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownLeft className="w-3 h-3 text-red-500" />}
                                         <div>
                                             <p className="font-medium capitalize">{t.type?.replace('_', ' ')}</p>
                                             <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                                         </div>
                                     </div>
                                     <span className={`font-mono font-medium ${t.amount > 0 ? 'text-green-500' : 'text-foreground'}`}>
                                         {t.amount > 0 ? '+' : ''}{t.amount}
                                     </span>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Role Management */}
            <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Role & Permissions
                </label>
                <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex gap-2">
                        <Button 
                            variant={role === 'user' ? 'default' : 'outline'} 
                            onClick={() => setRole('user')}
                            className="flex-1"
                            size="sm"
                        >
                            User
                        </Button>
                        <Button 
                            variant={role === 'admin' ? 'destructive' : 'outline'} 
                            onClick={() => setRole('admin')}
                            className="flex-1"
                            size="sm"
                        >
                            Admin
                        </Button>
                    </div>
                    {role !== user.role && (
                        <Button onClick={handleUpdateRole} disabled={loading} className="w-full" size="sm" variant="secondary">
                            <Save className="w-4 h-4 mr-2" /> Save Role Change
                        </Button>
                    )}
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
