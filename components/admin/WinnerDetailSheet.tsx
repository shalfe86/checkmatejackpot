
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Winner, PayoutScheduleItem } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { calculatePayoutSchedule, getCashValueRatio } from '../../lib/admin/payoutUtils';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Calendar, DollarSign, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/card';

interface Props {
  winner: Winner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const WinnerDetailSheet = ({ winner, open, onOpenChange, onUpdate }: Props) => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<PayoutScheduleItem[]>([]);

  // Fetch schedules if they exist
  React.useEffect(() => {
    if (winner && open) {
        supabase.from('payout_schedules').select('*').eq('winner_id', winner.id).order('due_date', { ascending: true })
        .then(({ data }) => {
            if (data && data.length > 0) setSchedules(data);
            else setSchedules([]);
        });
    }
  }, [winner, open]);

  if (!winner) return null;

  const handleGenerateSchedule = async () => {
      setLoading(true);
      try {
        // Calculate amount based on payout type
        let finalAmount = winner.amount;
        if (winner.payout_type === 'lump_sum' && winner.amount >= 20000) {
            finalAmount = winner.amount * getCashValueRatio(winner.amount);
        }

        const newSchedule = calculatePayoutSchedule(winner.id, finalAmount, winner.payout_type);
        
        // Insert into DB
        const { error } = await supabase.from('payout_schedules').insert(newSchedule);
        if (error) throw error;
        
        // Update winner status
        await supabase.from('winners').update({ status: 'scheduled' }).eq('id', winner.id);
        
        onUpdate();
        onOpenChange(false);
      } catch (e: any) {
          alert('Error: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const updateStatus = async (status: string) => {
      setLoading(true);
      await supabase.from('winners').update({ status }).eq('id', winner.id);
      onUpdate();
      setLoading(false);
      onOpenChange(false);
  };

  const updateScheduleStatus = async (id: string, status: string) => {
      await supabase.from('payout_schedules').update({ status }).eq('id', id);
      // Refresh local list
      const { data } = await supabase.from('payout_schedules').select('*').eq('winner_id', winner.id).order('due_date', { ascending: true });
      if (data) setSchedules(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex justify-between items-start">
            <div>
                <SheetTitle>Winner Details</SheetTitle>
                <SheetDescription>Case ID: {winner.id.slice(0, 8)}</SheetDescription>
            </div>
            <Badge variant={winner.tier === 'world' ? 'gold' : 'secondary'}>{winner.tier.toUpperCase()}</Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
            {/* Core Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase font-bold">User</label>
                    <p className="font-medium text-sm">{winner.email || 'Unknown Email'}</p>
                    <p className="text-xs text-muted-foreground">{winner.user_id}</p>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase font-bold">Win Amount</label>
                    <p className="font-bold text-xl text-primary">{formatCurrency(winner.amount)}</p>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase font-bold">Current Status</label>
                    <Badge variant={winner.status === 'paid' ? 'default' : winner.status === 'flagged' ? 'destructive' : 'outline'}>
                        {winner.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase font-bold">Payout Preference</label>
                    <p className="text-sm capitalize">{winner.payout_type.replace('_', ' ')}</p>
                </div>
            </div>

            {/* KYC Section */}
            <Card className="p-4 bg-secondary/10 border-muted">
                <h3 className="font-bold mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> KYC & Verification</h3>
                {winner.kyc_status === 'pending' ? (
                    <div className="space-y-2">
                        <p className="text-sm text-yellow-500">Verification Pending</p>
                        <div className="flex gap-2">
                             <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10" onClick={() => updateStatus('verified')}>Approve KYC</Button>
                             <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10" onClick={() => updateStatus('kyc_required')}>Reject / Request Info</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-green-500 font-medium">
                        <CheckCircle className="w-4 h-4" /> Identity Verified
                    </div>
                )}
            </Card>

            {/* Payout Schedule Section */}
            <div>
                <h3 className="font-bold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4"/> Payout Schedule</h3>
                
                {schedules.length === 0 ? (
                    <div className="text-center p-6 border border-dashed rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground mb-4">No schedule generated yet.</p>
                        {winner.amount >= 0 && ( // Assuming amount > 0
                            <Button onClick={handleGenerateSchedule} disabled={loading} variant="secondary">
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2"/>}
                                Generate {winner.payout_type === 'annuity' ? 'Annuity' : 'Lump Sum'} Schedule
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {schedules.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded bg-card text-sm">
                                <div>
                                    <p className="font-medium">Installment {item.installment_number}/{item.total_installments}</p>
                                    <p className="text-xs text-muted-foreground">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold mb-1">{formatCurrency(item.amount)}</p>
                                    {item.status === 'pending' ? (
                                         <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => item.id && updateScheduleStatus(item.id, 'paid')}>Mark Paid</Button>
                                    ) : (
                                        <Badge variant="outline" className="text-green-500 border-green-500">PAID</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Actions */}
            <div className="pt-4 border-t flex justify-between">
                <Button variant="outline" className="text-red-500 border-red-500/50 hover:bg-red-900/10" onClick={() => updateStatus('flagged')}>
                    <AlertTriangle className="w-4 h-4 mr-2" /> Flag for Review
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};