import { createClient } from '@supabase/supabase-js';

// Derived from your connection string: db.hejgvnlkkslybzqsbuxm.supabase.co
const SUPABASE_URL = 'https://hejgvnlkkslybzqsbuxm.supabase.co';

// ⚠️ YOU STILL NEED TO PASTE YOUR ANON KEY BELOW
// Go to Supabase Dashboard -> Project Settings -> API -> Project API keys -> anon public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlamd2bmxra3NseWJ6cXNidXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzQxODgsImV4cCI6MjA4MTE1MDE4OH0.eCrjZyUi7bG278d7JK3lKLHK-nvX9IXGbJjS_-lodeQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);