
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crown, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="bg-[#020617] border-b border-white/5 sticky top-0 z-50">
      <div className="container flex h-20 items-center justify-between mx-auto px-6 max-w-7xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white group">
            <Crown className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" />
            <span>CheckMate <span className="text-primary font-black">Jackpot</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link to="/play" className="hover:text-white transition-colors">Play</Link>
            <Link to="/rules" className="hover:text-white transition-colors">How It Works</Link>
            <Link to="/admin/winners" className="hover:text-white transition-colors">Winners</Link>
            <Link to="/rules#tiers" className="hover:text-white transition-colors">Tiers</Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors">
              <User className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors">
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
          
          <Button 
            onClick={() => navigate('/play')}
            className="bg-primary hover:bg-primary/90 text-black font-bold gap-2 px-6 rounded-md shadow-[0_0_15px_rgba(234,179,8,0.3)]"
          >
            <Trophy className="w-4 h-4" />
            Play Now
          </Button>
        </div>
      </div>
    </nav>
  );
};

import { Trophy } from 'lucide-react';
