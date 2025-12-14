import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Loader2, Save, RotateCcw, AlertTriangle, Settings2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { JackpotInfo } from '../../../types';

export const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [jackpots, setJackpots] = useState<{tier: string, amount: number}[]>([]);
  
  // Local edit state
  const [starterAmount, setStarterAmount] = useState('5.00');
  const [worldAmount, setWorldAmount] = useState('5.00');

  const fetchJackpots = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from('jackpots').select('*');
        if (error) throw error;
        
        setJackpots(data || []);
        
        const starter = data?.find(j => j.tier === 'starter');
        const world = data?.find(j => j.tier === 'world');
        
        if (starter) setStarterAmount(starter.amount.toString());
        if (world) setWorldAmount(world.amount.toString());

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchJackpots();
  }, []);

  const handleSave = async (tier: string, amountStr: string) => {
      setUpdating(true);
      try {
          const amount = parseFloat(amountStr);
          if (isNaN(amount)) throw new Error("Invalid amount");

          const { error } = await supabase
            .from('jackpots')
            .update({ amount: amount })
            .eq('tier', tier);
          
          if (error) throw error;
          
          await fetchJackpots();
          alert(`${tier.toUpperCase()} jackpot updated successfully.`);
      } catch (e: any) {
          alert('Error: ' + e.message);
      } finally {
          setUpdating(false);
      }
  };

  const handleReset = async (tier: string) => {
      if(!confirm(`Are you sure you want to reset the ${tier} jackpot to $5.00?`)) return;
      handleSave(tier, "5.00");
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure game economy and global variables.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Starter Tier Config */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Starter Jackpot
                    <Badge variant="secondary">Tier 2</Badge>
                </CardTitle>
                <CardDescription>Manually override the current jackpot pool.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Current Amount ($)</label>
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            value={starterAmount} 
                            onChange={(e) => setStarterAmount(e.target.value)} 
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Standard increment: +$0.75 / game</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                <Button variant="ghost" size="sm" onClick={() => handleReset('starter')} className="text-destructive hover:bg-destructive/10">
                    <RotateCcw className="w-4 h-4 mr-2"/> Reset to Base
                </Button>
                <Button size="sm" onClick={() => handleSave('starter', starterAmount)} disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} Update
                </Button>
            </CardFooter>
        </Card>

        {/* World Tier Config */}
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    World Jackpot
                    <Badge variant="gold">Tier 3</Badge>
                </CardTitle>
                <CardDescription>Manually override the current jackpot pool.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Current Amount ($)</label>
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            value={worldAmount} 
                            onChange={(e) => setWorldAmount(e.target.value)} 
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Standard increment: +$1.00 / game</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                <Button variant="ghost" size="sm" onClick={() => handleReset('world')} className="text-destructive hover:bg-destructive/10">
                    <RotateCcw className="w-4 h-4 mr-2"/> Reset to Base
                </Button>
                <Button size="sm" onClick={() => handleSave('world', worldAmount)} disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} Update
                </Button>
            </CardFooter>
        </Card>
      </div>

      {/* System Status Mock */}
      <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5"/> Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Disable all new games. Active games will finish.</p>
                  </div>
                  <Button variant="destructive" disabled>Enable Maintenance</Button>
              </div>
          </CardContent>
      </Card>
    </div>
  );
};