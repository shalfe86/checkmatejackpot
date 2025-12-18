
// NOTE: Since the existing app uses React Router in App.tsx, 
// this file is conceptually 'AdminLayout' to be used in routes.

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Fixed: Set children as optional to avoid TS error in App.tsx
export const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    if (!loading) {
        if (!user) {
            navigate('/auth');
            return;
        }

        const checkRole = async () => {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (data?.role !== 'admin') {
                navigate('/dashboard'); // Kick non-admins out
            } else {
                setIsAdmin(true);
            }
            setChecking(false);
        };
        checkRole();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
      return <div className="h-screen w-full flex items-center justify-center bg-background text-primary animate-pulse">Verifying Admin Access...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto max-h-screen">
            <div className="p-8">
                {children}
            </div>
        </main>
    </div>
  );
};
