import { createClient } from '@supabase/supabase-js';

// Safe retrieval of keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debugging
console.log("Supabase Init:", supabaseUrl ? "URL Found" : "URL Missing");
const supabaseUrl = envUrl || 'https://hejgvnlkkslybzqsbuxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlamd2bmxra3NseWJ6cXNidXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzQxODgsImV4cCI6MjA4MTE1MDE4OH0.eCrjZyUi7bG278d7JK3lKLHK-nvX9IXGbJjS_-lodeQ';

export const supabase = createClient(finalUrl, finalKey);