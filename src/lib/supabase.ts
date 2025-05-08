import { createClient } from '@supabase/supabase-js';

// Define fallback hardcoded credentials
const FALLBACK_SUPABASE_URL = 'https://wpehmvcmplxlagwscgxk.supabase.co';
const FALLBACK_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZWhtdmNtcGx4bGFnd3NjZ3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjA2ODQsImV4cCI6MjA2MTkzNjY4NH0.aAdaosqa7zFL4MBzxbVDtfmokVL6iJ8gZSR_-nkQIwc';

// Get environment variables with fallback to hardcoded credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_KEY;

// Log which credentials we're using (but don't expose the actual key)
console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Using ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'environment' : 'fallback'} credentials for authentication`);

// Create and export the Supabase client
export const supabase = createClient(
  supabaseUrl, 
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Helper function to check if the Supabase connection is working
export async function checkSupabaseConnection() {
  try {
    // Simple query to check connection
    const { count, error } = await supabase
      .from('youtube_videos')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    return { 
      connected: true, 
      count: count || 0
    };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 