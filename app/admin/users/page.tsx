import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { UserDetailSheet } from '../../../components/admin/UserDetailSheet';
import { Loader2, Search, Filter, MoreHorizontal, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  credits: number;
  role: 'user' | 'admin';
  monthly_wins: number;
  created_at?: string;
}

export const UsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
        // Fetch data without server-side ordering to prevent errors if column missing
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        
        if (error) throw error;
        
        // Client-side sort
        const sortedData = (data || []).sort((a, b) => {
             const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
             const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
             return dateB - dateA;
        });

        setUsers(sortedData);
    } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || JSON.stringify(err));
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: UserProfile) => {
      setSelectedUser(user);
      setIsSheetOpen(true);
  };

  const filteredUsers = users.filter(u => 
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      u.id.includes(search)
  );

  if (error) {
    return (
       <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <div className="p-8 text-center border border-destructive/20 bg-destructive/5 rounded-lg max-w-2xl mx-auto">
               <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
               <h3 className="font-bold text-destructive">Error Loading Users</h3>
               <p className="text-muted-foreground mb-4">{error}</p>
               <Button onClick={fetchUsers} variant="outline">Retry</Button>
           </div>
       </div>
    );
 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage player accounts, credits, and roles.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search Username, ID..." 
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
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Monthly Wins</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                    </TableRow>
                ) : filteredUsers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="font-medium">{user.username || 'No Username'}</div>
                                <div className="text-xs text-muted-foreground">{user.email || user.id.slice(0, 8)}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                                {user.credits}
                            </TableCell>
                            <TableCell>
                                {user.monthly_wins}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      <UserDetailSheet 
        user={selectedUser} 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        onUpdate={fetchUsers}
      />
    </div>
  );
};