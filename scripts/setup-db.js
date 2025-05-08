/**
 * Database setup script for YouTube Analyzer
 * 
 * This script checks and creates required database tables
 * Run this script with Node.js to set up your database structure
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in .env file');
  console.error('Make sure you have a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Main function to run the setup
async function main() {
  console.log('Starting database setup...');
  
  try {
    // Create the google_trends table
    console.log('Creating Google Trends table...');
    
    const { error: tableError } = await supabase
      .from('google_trends')
      .select('count(*)', { count: 'exact', head: true })
      .limit(1)
      .catch(() => {
        // Table doesn't exist, create it
        return { error: { message: 'Table does not exist' } };
      });
    
    if (tableError) {
      console.log('Google Trends table does not exist yet, creating it...');
      
      const { error: createError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS google_trends (
          id SERIAL PRIMARY KEY,
          keyword TEXT NOT NULL,
          rank INTEGER NOT NULL,
          time_period TEXT NOT NULL CHECK (time_period IN ('today', '7days', '30days')),
          scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS google_trends_time_period_idx ON google_trends(time_period);
        CREATE INDEX IF NOT EXISTS google_trends_scraped_at_idx ON google_trends(scraped_at);
        CREATE INDEX IF NOT EXISTS google_trends_rank_idx ON google_trends(rank);
      `);
      
      if (createError) {
        console.error('Error creating Google Trends table:', createError);
      } else {
        console.log('Google Trends table created successfully');
      }
    } else {
      console.log('Google Trends table already exists');
    }
    
    console.log('Database setup completed');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main(); 