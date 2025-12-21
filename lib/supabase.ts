import { createClient } from '@supabase/supabase-js';

// Read from Vite env with safe fallbacks for local dev
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = envUrl || 'https://hejgvnlkkslybzqsbuxm.supabase.co';
const SUPABASE_ANON_KEY = envAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlamd2bmxra3NseWJ6cXNidXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzQxODgsImV4cCI6MjA4MTE1MDE4OH0.eCrjZyUi7bG278d7JK3lKLHK-nvX9IXGbJjS_-lodeQ';

console.log('Supabase Init:', SUPABASE_URL ? 'URL Found' : 'URL Missing');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);