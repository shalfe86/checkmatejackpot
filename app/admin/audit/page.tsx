import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
             const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', adminIds);
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
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Security log of all administrative actions.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs}><RefreshCw className="w-4 h-4 mr-2"/> Refresh</Button>
      </div>

      {error && (
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

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