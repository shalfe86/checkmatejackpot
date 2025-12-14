import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, LayoutDashboard, Users, Settings, Trophy, LogOut, User, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col sticky top-0">
      <div className="p-6 border-b border-border">
         <Link to="/admin" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Crown className="w-6 h-6 text-primary" />
            <span>Admin<span className="text-primary">Panel</span></span>
         </Link>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
         <Link to="/admin/dashboard">
            <Button variant={isActive('/admin/dashboard') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
         </Link>
         <Link to="/admin/winners">
            <Button variant={isActive('/admin/winners') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                <Trophy className="w-4 h-4" /> Winners
            </Button>
         </Link>
         <Link to="/admin/users">
            <Button variant={isActive('/admin/users') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                <Users className="w-4 h-4" /> Users
            </Button>
         </Link>
         <Link to="/admin/audit">
            <Button variant={isActive('/admin/audit') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                <ClipboardList className="w-4 h-4" /> Audit Logs
            </Button>
         </Link>
         <Link to="/admin/settings">
            <Button variant={isActive('/admin/settings') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                <Settings className="w-4 h-4" /> Platform Settings
            </Button>
         </Link>
      </div>

      <div className="p-4 border-t border-border">
         {user && (
            <div className="mb-4 px-2 flex items-center gap-3 text-sm text-muted-foreground overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground truncate block">{user.email}</span>
                    <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Administrator</span>
                </div>
            </div>
         )}
         <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign Out
         </Button>
      </div>
    </div>
  );
};