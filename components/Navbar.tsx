import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Crown className="w-6 h-6 text-primary" />
            <span>CheckMate<span className="text-primary">Jackpot</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {!isDashboard && (
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              {isDashboard && (
                <Link to="/">
                  <Button variant="ghost">Home</Button>
                </Link>
              )}
              <Button onClick={() => signOut()} variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
             <Link to="/auth">
              <Button variant="default" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};