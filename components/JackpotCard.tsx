import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trophy, TrendingUp, Lock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { GameTier } from '../types';
import { useNavigate } from 'react-router-dom';

interface JackpotCardProps {
  title: string;
  amount: number;
  tier: GameTier;
  isCapped?: boolean;
  entryFee: string;
  description: string;
  eligibility?: string;
}

export const JackpotCard = ({
  title,
  amount,
  tier,
  isCapped = false,
  entryFee,
  description,
  eligibility,
}: JackpotCardProps) => {
  const navigate = useNavigate();

  const handlePlay = () => {
    navigate(`/play?tier=${tier}`);
  };

  return (
    <Card className="relative overflow-hidden border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 group">
      {tier === GameTier.WORLD && (
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy className="w-24 h-24 rotate-12" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
            <Badge variant={tier === GameTier.STARTER ? 'secondary' : 'gold'} className="mb-2">
                {tier === GameTier.STARTER ? 'Starter Tier' : 'World Tier'}
            </Badge>
            {isCapped && <Badge variant="destructive">MAXED</Badge>}
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-primary">
          {formatCurrency(amount)}
        </CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
            <p>{description}</p>
            <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Entry: <span className="text-foreground font-medium">{entryFee}</span></span>
            </div>
             {eligibility && (
                <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-500" />
                    <span>{eligibility}</span>
                </div>
            )}
        </div>
        <Button onClick={handlePlay} className="w-full" variant={tier === GameTier.WORLD ? 'default' : 'secondary'}>
            Play Now
        </Button>
      </CardContent>
    </Card>
  );
};
