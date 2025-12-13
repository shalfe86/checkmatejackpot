import React, { useEffect } from 'react';

interface TimerProps {
  secondsRemaining: number;
  isActive: boolean;
  label?: string;
}

export const Timer = ({ secondsRemaining, isActive, label }: TimerProps) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border ${isActive ? 'bg-secondary border-primary text-primary' : 'bg-background border-border text-muted-foreground'}`}>
      <span className="text-xs uppercase font-bold tracking-wider">{label}</span>
      <span className="font-mono text-xl font-medium">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};
