-- Copy and run this script in the Supabase SQL Editor to create the google_trends table

-- Create the google_trends table if it doesn't exist
CREATE TABLE IF NOT EXISTS google_trends (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  rank INTEGER NOT NULL,
  time_period TEXT NOT NULL CHECK (time_period IN ('today', '7days', '30days')),
  region TEXT DEFAULT 'GLOBAL',
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on time_period for faster queries
CREATE INDEX IF NOT EXISTS google_trends_time_period_idx ON google_trends(time_period);

-- Create an index on scraped_at for faster queries
CREATE INDEX IF NOT EXISTS google_trends_scraped_at_idx ON google_trends(scraped_at);

-- Create an index on rank for faster ordering
CREATE INDEX IF NOT EXISTS google_trends_rank_idx ON google_trends(rank);

-- Create an index on region for faster filtering
CREATE INDEX IF NOT EXISTS google_trends_region_idx ON google_trends(region);

-- Add a comment on the table for documentation
COMMENT ON TABLE google_trends IS 'Stores Google Trends data for YouTube searches';

-- Return success message
SELECT 'Google Trends table created or already exists' as result; 