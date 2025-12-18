import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { AuditLogEntry } from '../../../types';

export const AuditPage = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;

        // Fetch admin emails manually to avoid complex joins on client side if easy
        const adminIds = Array.from(new Set(data?.map(l => l.admin_id).filter(Boolean)));
        if (adminIds.length > 0) {
             const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, email').in('id', adminIds);
             
             // If profiles fail to load, we just proceed without them rather than breaking the whole page
             if (profileError) {
                console.warn('Could not fetch admin profiles for audit logs:', profileError);
             }

             const profileMap = new Map(profiles?.map(p => [p.id, p.email]));
             
             const enrichedLogs = data?.map(log => ({
                 ...log,
                 admin_email: profileMap.get(log.admin_id) || 'Unknown'
             })) || [];
             setLogs(enrichedLogs);
        } else {
            setLogs(data || []);
        }

    } catch (err: any) {
        console.error('Error fetching logs:', err);
        // Robustly handle error message extraction to avoid [object Object]
        const msg = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (error) {
     const isTableMissing = error.toLowerCase().includes('does not exist') || error.toLowerCase().includes('relation');
     return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">Security log of all administrative actions.</p>
                </div>
            </div>
            
            <div className="p-8 text-center border border-destructive/20 bg-destructive/5 rounded-lg max-w-2xl mx-auto">
                {isTableMissing ? (
                    <>
                        <Database className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h3 className="font-bold text-xl text-destructive mb-2">Table Missing</h3>
                        <p className="text-muted-foreground mb-4">
                            The <code>audit_logs</code> table does not exist in your database.
                        </p>
                        <div className="bg-background p-4 rounded text-left text-xs font-mono border border-border overflow-auto max-h-40 mb-4 mx-auto max-w-md">
                            <p className="text-muted-foreground">
                                Please run the migration SQL to create the table.
                            </p>
                        </div>
                        <Button onClick={fetchLogs} variant="outline">Retry</Button>
                    </>
                ) : (
                    <>
                        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                        <h3 className="font-bold text-destructive">Error Loading Logs</h3>
                        <p className="text-muted-foreground mb-4 break-all">{error}</p>
                        <Button onClick={fetchLogs} variant="outline">Retry</Button>
                    </>
                )}
            </div>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Security log of all administrative actions.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs}><RefreshCw className="w-4 h-4 mr-2"/> Refresh</Button>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                    </TableRow>
                ) : logs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No logs found.
                        </TableCell>
                    </TableRow>
                ) : (
                    logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">
                                <span className="text-xs">{log.admin_email || log.admin_id}</span>
                            </TableCell>
                            <TableCell>
                                <span className="px-2 py-1 rounded bg-secondary text-xs font-mono uppercase">{log.action}</span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {log.target_table}:{log.target_id?.slice(0,8)}...
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                                <code className="text-[10px] bg-muted p-1 rounded block truncate">
                                    {JSON.stringify(log.details)}
                                </code>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
};