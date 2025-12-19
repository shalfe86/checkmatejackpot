/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Use Vite's import.meta.env typing. Provide fallbacks to avoid runtime crashes
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// DEBUG: Log these to the browser console so you can see if they work
console.log("Supabase URL:", envUrl ? "Found" : "MISSING");
console.log("Supabase Key:", envKey ? "Found" : "MISSING");
// 3. Fallback to prevent app crash (White Screen)
// If keys are missing, we use a fake URL so the app can at least render the UI,
// even if data fetching fails later.
const supabaseUrl = envUrl || 'https://hejgvnlkkslybzqsbuxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlamd2bmxra3NseWJ6cXNidXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzQxODgsImV4cCI6MjA4MTE1MDE4OH0.eCrjZyUi7bG278d7JK3lKLHK-nvX9IXGbJjS_-lodeQ';

const supabaseAnonKey = envKey || SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);