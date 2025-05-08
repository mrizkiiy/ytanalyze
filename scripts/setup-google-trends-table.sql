-- Create the google_trends table if it doesn't exist
CREATE TABLE IF NOT EXISTS google_trends (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  rank INTEGER NOT NULL,
  time_period TEXT NOT NULL CHECK (time_period IN ('today', '7days', '30days')),
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on time_period for faster queries
CREATE INDEX IF NOT EXISTS google_trends_time_period_idx ON google_trends(time_period);

-- Create an index on scraped_at for faster queries
CREATE INDEX IF NOT EXISTS google_trends_scraped_at_idx ON google_trends(scraped_at);

-- Create an index on rank for faster ordering
CREATE INDEX IF NOT EXISTS google_trends_rank_idx ON google_trends(rank);

-- Create a function to auto-update created_at
CREATE OR REPLACE FUNCTION update_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.created_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to auto-update created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'google_trends_created_at_trigger'
  ) THEN
    CREATE TRIGGER google_trends_created_at_trigger
    BEFORE UPDATE ON google_trends
    FOR EACH ROW
    EXECUTE FUNCTION update_created_at_column();
  END IF;
END
$$; 